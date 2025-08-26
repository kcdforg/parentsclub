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

// Authenticate user
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$user = $sessionManager->getUserFromSession($sessionToken);

if (!$user || $user['user_type'] !== 'user') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            handleGet($user['id']);
            break;
        case 'POST':
            handlePost($input, $user['id']);
            break;
        case 'PUT':
            handlePut($input, $user['id']);
            break;
        case 'DELETE':
            handleDelete($user['id']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Help Posts API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet($userId) {
    global $pdo;
    
    try {
        $post_id = $_GET['id'] ?? null;
        
        if ($post_id) {
            // Get specific help post and mark as viewed
            $stmt = $pdo->prepare("
                SELECT hp.*, u.email as author_email, up.name as author_name,
                       COUNT(DISTINCT hpl.id) as likes_count,
                       COUNT(DISTINCT hpc.id) as comments_count,
                       COUNT(DISTINCT hpv.id) as views_count,
                       EXISTS(SELECT 1 FROM help_post_likes WHERE post_id = hp.id AND user_id = ?) as user_liked
                FROM help_posts hp
                LEFT JOIN users u ON hp.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN help_post_likes hpl ON hp.id = hpl.post_id
                LEFT JOIN help_post_comments hpc ON hp.id = hpc.post_id
                LEFT JOIN help_post_views hpv ON hp.id = hpv.post_id
                WHERE hp.id = ? AND hp.status = 'approved'
                GROUP BY hp.id
            ");
            $stmt->execute([$userId, $post_id]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$post) {
                http_response_code(404);
                echo json_encode(['error' => 'Help post not found']);
                return;
            }
            
            // Check if user has access to this post
            if (!userHasAccessToPost($userId, $post)) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            // Mark as viewed
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO help_post_views (post_id, user_id, viewed_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$post_id, $userId]);
            
            // Parse JSON fields
            $post['target_groups'] = json_decode($post['target_groups'], true) ?? [];
            $post['attachments'] = json_decode($post['attachments'], true) ?? [];
            $post['images'] = json_decode($post['images'], true) ?? [];
            $post['target_areas'] = json_decode($post['target_areas'], true) ?? [];
            $post['target_institutions'] = json_decode($post['target_institutions'], true) ?? [];
            $post['target_companies'] = json_decode($post['target_companies'], true) ?? [];
            
            // Get comments with replies
            $stmt = $pdo->prepare("
                SELECT hpc.*, u.email, up.name as commenter_name,
                       EXISTS(SELECT 1 FROM help_post_likes WHERE post_id = hpc.id AND user_id = ?) as user_liked_comment
                FROM help_post_comments hpc
                LEFT JOIN users u ON hpc.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE hpc.post_id = ? AND hpc.parent_id IS NULL
                ORDER BY hpc.created_at DESC
            ");
            $stmt->execute([$userId, $post_id]);
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
            // Get help posts with pagination and filters
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $category = $_GET['category'] ?? '';
            $my_posts = $_GET['my_posts'] ?? false;
            $sort = $_GET['sort'] ?? 'newest'; // newest, oldest, most_liked, most_viewed
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE hp.status = 'approved'";
            $params = [];
            
            if ($my_posts) {
                $whereClause .= " AND hp.user_id = ?";
                $params[] = $userId;
            } else {
                // Only show posts user has access to
                $whereClause .= " AND (" . buildAccessCondition($userId) . ")";
            }
            
            if ($category) {
                $whereClause .= " AND hp.category = ?";
                $params[] = $category;
            }
            
            // Sorting
            $orderClause = "ORDER BY hp.is_pinned DESC, ";
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
                       COUNT(DISTINCT hpv.id) as views_count,
                       EXISTS(SELECT 1 FROM help_post_likes WHERE post_id = hp.id AND user_id = ?) as user_liked,
                       EXISTS(SELECT 1 FROM help_post_views WHERE post_id = hp.id AND user_id = ?) as user_viewed
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
            $stmt->execute([$userId, $userId, ...$params, $limit, $offset]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields for each post
            foreach ($posts as &$post) {
                $post['target_groups'] = json_decode($post['target_groups'], true) ?? [];
                $post['attachments'] = json_decode($post['attachments'], true) ?? [];
                $post['images'] = json_decode($post['images'], true) ?? [];
                $post['target_areas'] = json_decode($post['target_areas'], true) ?? [];
                $post['target_institutions'] = json_decode($post['target_institutions'], true) ?? [];
                $post['target_companies'] = json_decode($post['target_companies'], true) ?? [];
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

function handlePost($input, $userId) {
    global $pdo;
    
    $action = $input['action'] ?? 'create';
    
    try {
        switch ($action) {
            case 'create':
                return createHelpPost($input, $userId);
            case 'like':
                return handleLike($input, $userId);
            case 'comment':
                return handleComment($input, $userId);
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
                break;
        }
    } catch (Exception $e) {
        error_log("Error in handlePost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
}

function createHelpPost($input, $userId) {
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
    $category = trim($input['category'] ?? '');
    $visibility = $input['visibility'] ?? 'public'; // public, groups, custom
    $target_groups = $input['target_groups'] ?? [];
    $target_areas = $input['target_areas'] ?? [];
    $target_institutions = $input['target_institutions'] ?? [];
    $target_companies = $input['target_companies'] ?? [];
    $attachments = $input['attachments'] ?? [];
    $images = $input['images'] ?? [];
    
    // Validate targeting
    if ($visibility === 'groups' && empty($target_groups)) {
        http_response_code(400);
        echo json_encode(['error' => 'Please select at least one group for group visibility']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO help_posts (
                user_id, title, content, category, visibility, target_groups, 
                target_areas, target_institutions, target_companies, 
                attachments, images, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        ");
        $stmt->execute([
            $userId,
            $title,
            $content,
            $category,
            $visibility,
            json_encode($target_groups),
            json_encode($target_areas),
            json_encode($target_institutions),
            json_encode($target_companies),
            json_encode($attachments),
            json_encode($images)
        ]);
        
        $postId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$postId,
                'title' => $title,
                'status' => 'pending'
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in createHelpPost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleLike($input, $userId) {
    global $pdo;
    
    if (!isset($input['post_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    $postId = (int)$input['post_id'];
    $action = $input['like_action'] ?? 'toggle'; // toggle, like, unlike
    
    try {
        // Check if post exists and user has access
        $stmt = $pdo->prepare("
            SELECT hp.* FROM help_posts hp 
            WHERE hp.id = ? AND hp.status = 'approved'
        ");
        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$post || !userHasAccessToPost($userId, $post)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // Check current like status
        $stmt = $pdo->prepare("SELECT id FROM help_post_likes WHERE post_id = ? AND user_id = ?");
        $stmt->execute([$postId, $userId]);
        $existingLike = $stmt->fetch();
        
        if ($action === 'toggle') {
            if ($existingLike) {
                // Unlike
                $stmt = $pdo->prepare("DELETE FROM help_post_likes WHERE post_id = ? AND user_id = ?");
                $stmt->execute([$postId, $userId]);
                $liked = false;
            } else {
                // Like
                $stmt = $pdo->prepare("INSERT INTO help_post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())");
                $stmt->execute([$postId, $userId]);
                $liked = true;
            }
        } elseif ($action === 'like' && !$existingLike) {
            $stmt = $pdo->prepare("INSERT INTO help_post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())");
            $stmt->execute([$postId, $userId]);
            $liked = true;
        } elseif ($action === 'unlike' && $existingLike) {
            $stmt = $pdo->prepare("DELETE FROM help_post_likes WHERE post_id = ? AND user_id = ?");
            $stmt->execute([$postId, $userId]);
            $liked = false;
        } else {
            $liked = !!$existingLike;
        }
        
        // Get updated like count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM help_post_likes WHERE post_id = ?");
        $stmt->execute([$postId]);
        $likesCount = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'liked' => $liked,
                'likes_count' => (int)$likesCount
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleLike: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleComment($input, $userId) {
    global $pdo;
    
    if (!isset($input['post_id']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID and content are required']);
        return;
    }
    
    $postId = (int)$input['post_id'];
    $content = trim($input['content']);
    $parentId = isset($input['parent_id']) ? (int)$input['parent_id'] : null;
    
    if (empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Comment content cannot be empty']);
        return;
    }
    
    try {
        // Check if post exists and user has access
        $stmt = $pdo->prepare("SELECT hp.* FROM help_posts hp WHERE hp.id = ? AND hp.status = 'approved'");
        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$post || !userHasAccessToPost($userId, $post)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // If replying to a comment, verify parent comment exists
        if ($parentId) {
            $stmt = $pdo->prepare("SELECT id FROM help_post_comments WHERE id = ? AND post_id = ?");
            $stmt->execute([$parentId, $postId]);
            if (!$stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Parent comment not found']);
                return;
            }
        }
        
        // Insert comment
        $stmt = $pdo->prepare("
            INSERT INTO help_post_comments (post_id, user_id, parent_id, content, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$postId, $userId, $parentId, $content]);
        
        $commentId = $pdo->lastInsertId();
        
        // Get comment details
        $stmt = $pdo->prepare("
            SELECT hpc.*, u.email, up.name as commenter_name
            FROM help_post_comments hpc
            LEFT JOIN users u ON hpc.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE hpc.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $comment
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleComment: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePut($input, $userId) {
    global $pdo;
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    $id = (int)$input['id'];
    
    try {
        // Check if user owns the post
        $stmt = $pdo->prepare("SELECT * FROM help_posts WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Help post not found or access denied']);
            return;
        }
        
        // Only allow editing if post is pending or user is updating content
        if ($post['status'] !== 'pending' && $post['status'] !== 'approved') {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot edit rejected posts']);
            return;
        }
        
        $title = trim($input['title'] ?? $post['title']);
        $content = trim($input['content'] ?? $post['content']);
        $category = trim($input['category'] ?? $post['category']);
        
        if (empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content are required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE help_posts 
            SET title = ?, content = ?, category = ?, updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$title, $content, $category, $id, $userId]);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $id,
                'title' => $title,
                'content' => $content,
                'category' => $category
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handlePut: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleDelete($userId) {
    global $pdo;
    
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        // Check if user owns the post
        $stmt = $pdo->prepare("SELECT id FROM help_posts WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Help post not found or access denied']);
            return;
        }
        
        $pdo->beginTransaction();
        
        // Delete related data
        $pdo->prepare("DELETE FROM help_post_likes WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM help_post_comments WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM help_post_views WHERE post_id = ?")->execute([$id]);
        
        // Delete help post
        $stmt = $pdo->prepare("DELETE FROM help_posts WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function userHasAccessToPost($userId, $post) {
    global $pdo;
    
    $visibility = $post['visibility'];
    
    if ($visibility === 'public') {
        return true;
    }
    
    if ($visibility === 'groups') {
        $targetGroups = json_decode($post['target_groups'], true) ?? [];
        if (empty($targetGroups)) return false;
        
        $groupIds = implode(',', array_map('intval', $targetGroups));
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM group_members 
            WHERE user_id = ? AND group_id IN ($groupIds) AND is_active = 1
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchColumn() > 0;
    }
    
    if ($visibility === 'custom') {
        // Check against user's profile for area, institution, company matching
        $stmt = $pdo->prepare("
            SELECT district, post_office_area, institution, company 
            FROM user_profiles 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile) return false;
        
        $targetAreas = json_decode($post['target_areas'], true) ?? [];
        $targetInstitutions = json_decode($post['target_institutions'], true) ?? [];
        $targetCompanies = json_decode($post['target_companies'], true) ?? [];
        
        // Check if user matches any targeting criteria
        if (!empty($targetAreas) && in_array($profile['district'], $targetAreas)) return true;
        if (!empty($targetInstitutions) && in_array($profile['institution'], $targetInstitutions)) return true;
        if (!empty($targetCompanies) && in_array($profile['company'], $targetCompanies)) return true;
        
        return false;
    }
    
    return false;
}

function buildAccessCondition($userId) {
    global $pdo;
    
    // Get user's groups
    $stmt = $pdo->prepare("SELECT group_id FROM group_members WHERE user_id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    $userGroups = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get user's profile for targeting
    $stmt = $pdo->prepare("SELECT district, post_office_area, institution, company FROM user_profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $conditions = ["hp.visibility = 'public'"];
    
    // Group-based access
    if (!empty($userGroups)) {
        $groupConditions = [];
        foreach ($userGroups as $groupId) {
            $groupConditions[] = "JSON_CONTAINS(hp.target_groups, '" . json_encode([(int)$groupId]) . "')";
        }
        if (!empty($groupConditions)) {
            $conditions[] = "(hp.visibility = 'groups' AND (" . implode(' OR ', $groupConditions) . "))";
        }
    }
    
    // Custom targeting based on profile
    if ($profile) {
        $customConditions = [];
        if ($profile['district']) {
            $customConditions[] = "JSON_CONTAINS(hp.target_areas, '" . json_encode([$profile['district']]) . "')";
        }
        if ($profile['institution']) {
            $customConditions[] = "JSON_CONTAINS(hp.target_institutions, '" . json_encode([$profile['institution']]) . "')";
        }
        if ($profile['company']) {
            $customConditions[] = "JSON_CONTAINS(hp.target_companies, '" . json_encode([$profile['company']]) . "')";
        }
        
        if (!empty($customConditions)) {
            $conditions[] = "(hp.visibility = 'custom' AND (" . implode(' OR ', $customConditions) . "))";
        }
    }
    
    return implode(' OR ', $conditions);
}
?>
