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
        case 'POST':
            handlePost($input, $admin['id']);
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
    error_log("Announcements API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $announcement_id = $_GET['id'] ?? null;
        
        if ($announcement_id) {
            // Get specific announcement with details
            $stmt = $pdo->prepare("
                SELECT a.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT al.id) as likes_count,
                       COUNT(DISTINCT ac.id) as comments_count
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN announcement_likes al ON a.id = al.announcement_id
                LEFT JOIN announcement_comments ac ON a.id = ac.announcement_id
                WHERE a.id = ?
                GROUP BY a.id
            ");
            $stmt->execute([$announcement_id]);
            $announcement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => 'Announcement not found']);
                return;
            }
            
            // Parse JSON fields
            $announcement['target_groups'] = json_decode($announcement['target_groups'], true) ?? [];
            $announcement['attachments'] = json_decode($announcement['attachments'], true) ?? [];
            $announcement['images'] = json_decode($announcement['images'], true) ?? [];
            
            // Get target group names
            if (!empty($announcement['target_groups'])) {
                $groupIds = implode(',', array_map('intval', $announcement['target_groups']));
                $stmt = $pdo->prepare("SELECT id, name FROM groups WHERE id IN ($groupIds) AND is_active = 1");
                $stmt->execute();
                $announcement['target_group_names'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $announcement['target_group_names'] = [];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $announcement
            ]);
        } else {
            // Get all announcements with pagination and filters
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $search = $_GET['search'] ?? '';
            $group_id = $_GET['group_id'] ?? '';
            $status = $_GET['status'] ?? ''; // active, pinned, archived
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE 1=1";
            $params = [];
            
            if ($search) {
                $whereClause .= " AND (a.title LIKE ? OR a.content LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($group_id) {
                $whereClause .= " AND JSON_CONTAINS(a.target_groups, ?)";
                $params[] = json_encode([(int)$group_id]);
            }
            
            if ($status === 'pinned') {
                $whereClause .= " AND a.is_pinned = 1 AND a.is_archived = 0";
            } elseif ($status === 'archived') {
                $whereClause .= " AND a.is_archived = 1";
            } elseif ($status === 'active') {
                $whereClause .= " AND a.is_archived = 0";
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) FROM announcements a $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get announcements
            $stmt = $pdo->prepare("
                SELECT a.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT al.id) as likes_count,
                       COUNT(DISTINCT ac.id) as comments_count,
                       COUNT(DISTINCT av.id) as views_count
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN announcement_likes al ON a.id = al.announcement_id
                LEFT JOIN announcement_comments ac ON a.id = ac.announcement_id
                LEFT JOIN announcement_views av ON a.id = av.announcement_id
                $whereClause
                GROUP BY a.id
                ORDER BY a.is_pinned DESC, a.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields and get group names for each announcement
            foreach ($announcements as &$announcement) {
                $announcement['target_groups'] = json_decode($announcement['target_groups'], true) ?? [];
                $announcement['attachments'] = json_decode($announcement['attachments'], true) ?? [];
                $announcement['images'] = json_decode($announcement['images'], true) ?? [];
                
                // Get target group names
                if (!empty($announcement['target_groups'])) {
                    $groupIds = implode(',', array_map('intval', $announcement['target_groups']));
                    $stmt = $pdo->prepare("SELECT id, name FROM groups WHERE id IN ($groupIds) AND is_active = 1");
                    $stmt->execute();
                    $announcement['target_group_names'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $announcement['target_group_names'] = [];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $announcements,
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

function handlePost($input, $adminId) {
    global $pdo;
    
    if (!isset($input['title']) || empty(trim($input['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Title is required']);
        return;
    }
    
    if (!isset($input['content']) || empty(trim($input['content']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Content is required']);
        return;
    }
    
    $title = trim($input['title']);
    $content = trim($input['content']);
    $target_groups = $input['target_groups'] ?? [];
    $attachments = $input['attachments'] ?? [];
    $images = $input['images'] ?? [];
    $is_pinned = isset($input['is_pinned']) ? (bool)$input['is_pinned'] : false;
    
    // Validate target groups
    if (!empty($target_groups)) {
        $groupIds = implode(',', array_map('intval', $target_groups));
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM groups WHERE id IN ($groupIds) AND is_active = 1");
        $stmt->execute();
        $validGroups = $stmt->fetchColumn();
        
        if ($validGroups !== count($target_groups)) {
            http_response_code(400);
            echo json_encode(['error' => 'Some target groups are invalid']);
            return;
        }
    }
    
    try {
        $pdo->beginTransaction();
        
        // Insert announcement
        $stmt = $pdo->prepare("
            INSERT INTO announcements (title, content, created_by, target_groups, attachments, images, is_pinned, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $title, 
            $content, 
            $adminId, 
            json_encode($target_groups),
            json_encode($attachments),
            json_encode($images),
            $is_pinned
        ]);
        
        $announcementId = $pdo->lastInsertId();
        
        // Create notifications for group members
        if (!empty($target_groups)) {
            createAnnouncementNotifications($announcementId, $target_groups, $title);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$announcementId,
                'title' => $title,
                'content' => $content
            ]
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Database error in handlePost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePut($input, $adminId) {
    global $pdo;
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID is required']);
        return;
    }
    
    $id = (int)$input['id'];
    $action = $input['action'] ?? 'update';
    
    try {
        if ($action === 'pin') {
            // Pin/unpin announcement
            $is_pinned = isset($input['is_pinned']) ? (bool)$input['is_pinned'] : true;
            
            // Check pin limit (max 3 pinned announcements)
            if ($is_pinned) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM announcements WHERE is_pinned = 1 AND is_archived = 0 AND id != ?");
                $stmt->execute([$id]);
                $pinnedCount = $stmt->fetchColumn();
                
                if ($pinnedCount >= 3) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Maximum 3 announcements can be pinned at once']);
                    return;
                }
            }
            
            $stmt = $pdo->prepare("UPDATE announcements SET is_pinned = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$is_pinned, $id]);
            
            echo json_encode([
                'success' => true,
                'data' => ['id' => $id, 'is_pinned' => $is_pinned]
            ]);
            
        } elseif ($action === 'archive') {
            // Archive announcement
            $stmt = $pdo->prepare("
                UPDATE announcements 
                SET is_archived = 1, is_pinned = 0, archived_at = NOW(), updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            echo json_encode([
                'success' => true,
                'data' => ['id' => $id, 'is_archived' => true]
            ]);
            
        } else {
            // Update announcement content
            if (!isset($input['title']) || empty(trim($input['title']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                return;
            }
            
            if (!isset($input['content']) || empty(trim($input['content']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Content is required']);
                return;
            }
            
            $title = trim($input['title']);
            $content = trim($input['content']);
            $target_groups = $input['target_groups'] ?? [];
            $attachments = $input['attachments'] ?? [];
            $images = $input['images'] ?? [];
            
            $stmt = $pdo->prepare("
                UPDATE announcements 
                SET title = ?, content = ?, target_groups = ?, attachments = ?, images = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([
                $title, 
                $content, 
                json_encode($target_groups),
                json_encode($attachments),
                json_encode($images),
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Announcement not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'title' => $title,
                    'content' => $content
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
        echo json_encode(['error' => 'Announcement ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        $pdo->beginTransaction();
        
        // Delete related data
        $pdo->prepare("DELETE FROM announcement_likes WHERE announcement_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM announcement_comments WHERE announcement_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM announcement_views WHERE announcement_id = ?")->execute([$id]);
        
        // Delete announcement
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            $pdo->rollback();
            http_response_code(404);
            echo json_encode(['error' => 'Announcement not found']);
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

function createAnnouncementNotifications($announcementId, $targetGroups, $title) {
    global $pdo;
    
    try {
        // Get all users from target groups
        $groupIds = implode(',', array_map('intval', $targetGroups));
        $stmt = $pdo->prepare("
            SELECT DISTINCT gm.user_id 
            FROM group_members gm 
            WHERE gm.group_id IN ($groupIds) AND gm.is_active = 1
        ");
        $stmt->execute();
        $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Create notifications for each user
        $notificationStmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, created_at) 
            VALUES (?, 'announcement', ?, ?, 'announcement', ?, NOW())
        ");
        
        foreach ($userIds as $userId) {
            $notificationStmt->execute([
                $userId,
                'New Announcement',
                "New announcement: " . substr($title, 0, 100),
                $announcementId
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Error creating announcement notifications: " . $e->getMessage());
    }
}
?>
