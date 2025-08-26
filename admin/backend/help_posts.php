<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Authenticate admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$admin = $sessionManager->getUserFromSession($sessionToken);

if (!$admin || $admin['user_type'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'PUT':
            handlePut($input, $admin['id']);
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Help Posts Admin API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $post_id = $_GET['id'] ?? null;
        
        if ($post_id) {
            // Get specific help post with comments
            $stmt = $pdo->prepare("
                SELECT hp.*, u.email as author_email, up.name as author_name,
                       COUNT(DISTINCT hpl.id) as likes_count,
                       COUNT(DISTINCT hpc.id) as comments_count,
                       COUNT(DISTINCT hpv.id) as views_count
                FROM help_posts hp
                LEFT JOIN users u ON hp.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN help_post_likes hpl ON hp.id = hpl.post_id
                LEFT JOIN help_post_comments hpc ON hp.id = hpc.post_id
                LEFT JOIN help_post_views hpv ON hp.id = hpv.post_id
                WHERE hp.id = ?
                GROUP BY hp.id
            ");
            $stmt->execute([$post_id]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$post) {
                http_response_code(404);
                echo json_encode(['error' => 'Help post not found']);
                return;
            }
            
            // Parse JSON fields
            $post['target_groups'] = json_decode($post['target_groups'], true) ?? [];
            $post['attachments'] = json_decode($post['attachments'], true) ?? [];
            $post['images'] = json_decode($post['images'], true) ?? [];
            $post['target_areas'] = json_decode($post['target_areas'], true) ?? [];
            $post['target_institutions'] = json_decode($post['target_institutions'], true) ?? [];
            $post['target_companies'] = json_decode($post['target_companies'], true) ?? [];
            
            // Get target group names
            if (!empty($post['target_groups'])) {
                $groupIds = implode(',', array_map('intval', $post['target_groups']));
                $stmt = $pdo->prepare("SELECT id, name FROM groups WHERE id IN ($groupIds) AND is_active = 1");
                $stmt->execute();
                $post['target_group_names'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $post['target_group_names'] = [];
            }
            
            // Get comments
            $stmt = $pdo->prepare("
                SELECT hpc.*, u.email, up.name as commenter_name
                FROM help_post_comments hpc
                LEFT JOIN users u ON hpc.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE hpc.post_id = ? AND hpc.parent_id IS NULL
                ORDER BY hpc.created_at DESC
            ");
            $stmt->execute([$post_id]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get replies for each comment
            foreach ($comments as &$comment) {
                $stmt = $pdo->prepare("
                    SELECT hpc.*, u.email, up.name as commenter_name
                    FROM help_post_comments hpc
                    LEFT JOIN users u ON hpc.user_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE hpc.parent_id = ?
                    ORDER BY hpc.created_at ASC
                ");
                $stmt->execute([$comment['id']]);
                $comment['replies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            $post['comments'] = $comments;
            
            echo json_encode([
                'success' => true,
                'data' => $post
            ]);
        } else {
            // Get all help posts with pagination and filters
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? ''; // pending, approved, rejected
            $category = $_GET['category'] ?? '';
            $sort = $_GET['sort'] ?? 'newest'; // newest, oldest, most_liked, most_viewed
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE 1=1";
            $params = [];
            
            if ($search) {
                $whereClause .= " AND (hp.title LIKE ? OR hp.content LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($status) {
                $whereClause .= " AND hp.status = ?";
                $params[] = $status;
            }
            
            if ($category) {
                $whereClause .= " AND hp.category = ?";
                $params[] = $category;
            }
            
            // Sorting
            $orderClause = "ORDER BY ";
            switch ($sort) {
                case 'oldest':
                    $orderClause .= "hp.created_at ASC";
                    break;
                case 'most_liked':
                    $orderClause .= "likes_count DESC, hp.created_at DESC";
                    break;
                case 'most_viewed':
                    $orderClause .= "views_count DESC, hp.created_at DESC";
                    break;
                default: // newest
                    $orderClause .= "hp.created_at DESC";
                    break;
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) FROM help_posts hp $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get help posts
            $stmt = $pdo->prepare("
                SELECT hp.*, u.email as author_email, up.name as author_name,
                       COUNT(DISTINCT hpl.id) as likes_count,
                       COUNT(DISTINCT hpc.id) as comments_count,
                       COUNT(DISTINCT hpv.id) as views_count
                FROM help_posts hp
                LEFT JOIN users u ON hp.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN help_post_likes hpl ON hp.id = hpl.post_id
                LEFT JOIN help_post_comments hpc ON hp.id = hpc.post_id
                LEFT JOIN help_post_views hpv ON hp.id = hpv.post_id
                $whereClause
                GROUP BY hp.id
                $orderClause
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields and get group names for each post
            foreach ($posts as &$post) {
                $post['target_groups'] = json_decode($post['target_groups'], true) ?? [];
                $post['attachments'] = json_decode($post['attachments'], true) ?? [];
                $post['images'] = json_decode($post['images'], true) ?? [];
                $post['target_areas'] = json_decode($post['target_areas'], true) ?? [];
                $post['target_institutions'] = json_decode($post['target_institutions'], true) ?? [];
                $post['target_companies'] = json_decode($post['target_companies'], true) ?? [];
                
                // Get target group names
                if (!empty($post['target_groups'])) {
                    $groupIds = implode(',', array_map('intval', $post['target_groups']));
                    $stmt = $pdo->prepare("SELECT id, name FROM groups WHERE id IN ($groupIds) AND is_active = 1");
                    $stmt->execute();
                    $post['target_group_names'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $post['target_group_names'] = [];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $posts,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Database error in handleGet: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePut($input, $adminId) {
    global $pdo;
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    $id = (int)$input['id'];
    $action = $input['action'] ?? 'moderate';
    
    try {
        if ($action === 'moderate') {
            // Approve, reject, or pin post
            $status = $input['status'] ?? null;
            $is_pinned = isset($input['is_pinned']) ? (bool)$input['is_pinned'] : null;
            $admin_notes = $input['admin_notes'] ?? null;
            
            $updates = [];
            $params = [];
            
            if ($status && in_array($status, ['approved', 'rejected', 'pending'])) {
                $updates[] = "status = ?";
                $params[] = $status;
            }
            
            if ($is_pinned !== null) {
                // Check pinned limit (max 3)
                if ($is_pinned) {
                    $stmt = $pdo->prepare("SELECT COUNT(*) FROM help_posts WHERE is_pinned = 1 AND id != ?");
                    $stmt->execute([$id]);
                    $pinnedCount = $stmt->fetchColumn();
                    
                    if ($pinnedCount >= 3) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Maximum 3 posts can be pinned at once']);
                        return;
                    }
                }
                
                $updates[] = "is_pinned = ?";
                $params[] = $is_pinned ? 1 : 0;
            }
            
            if ($admin_notes !== null) {
                $updates[] = "admin_notes = ?";
                $params[] = $admin_notes;
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid updates provided']);
                return;
            }
            
            $updates[] = "moderated_by = ?";
            $updates[] = "moderated_at = NOW()";
            $updates[] = "updated_at = NOW()";
            $params[] = $adminId;
            $params[] = $id;
            
            $stmt = $pdo->prepare("
                UPDATE help_posts 
                SET " . implode(', ', $updates) . "
                WHERE id = ?
            ");
            $stmt->execute($params);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Help post not found']);
                return;
            }
            
            // Create notification for user if status changed
            if ($status && $status !== 'pending') {
                createModerationNotification($id, $status);
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'status' => $status,
                    'is_pinned' => $is_pinned
                ]
            ]);
            
        } elseif ($action === 'edit') {
            // Admin can edit help post content
            if (!isset($input['title']) || !isset($input['content'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Title and content are required']);
                return;
            }
            
            $title = trim($input['title']);
            $content = trim($input['content']);
            $category = $input['category'] ?? '';
            
            if (empty($title) || empty($content)) {
                http_response_code(400);
                echo json_encode(['error' => 'Title and content cannot be empty']);
                return;
            }
            
            $stmt = $pdo->prepare("
                UPDATE help_posts 
                SET title = ?, content = ?, category = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$title, $content, $category, $id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Help post not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'title' => $title,
                    'content' => $content,
                    'category' => $category
                ]
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Database error in handlePut: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleDelete() {
    global $pdo;
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        $pdo->beginTransaction();
        
        // Delete related data
        $pdo->prepare("DELETE FROM help_post_likes WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM help_post_comments WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM help_post_views WHERE post_id = ?")->execute([$id]);
        
        // Delete help post
        $stmt = $pdo->prepare("DELETE FROM help_posts WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            $pdo->rollback();
            http_response_code(404);
            echo json_encode(['error' => 'Help post not found']);
            return;
        }
        
        $pdo->commit();
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function createModerationNotification($postId, $status) {
    global $pdo;
    
    try {
        // Get post details
        $stmt = $pdo->prepare("SELECT user_id, title FROM help_posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$post) return;
        
        $title = $status === 'approved' ? 'Help Post Approved' : 'Help Post Rejected';
        $message = $status === 'approved' ? 
            "Your help post \"" . substr($post['title'], 0, 50) . "\" has been approved and is now visible to the community." :
            "Your help post \"" . substr($post['title'], 0, 50) . "\" has been rejected. Please check admin notes for details.";
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, created_at) 
            VALUES (?, 'help_post', ?, ?, 'help_post', ?, NOW())
        ");
        $stmt->execute([$post['user_id'], $title, $message, $postId]);
        
    } catch (PDOException $e) {
        error_log("Error creating moderation notification: " . $e->getMessage());
    }
}
?>
