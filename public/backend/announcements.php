<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("User Announcements API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet($userId) {
    global $pdo;
    
    try {
        $announcement_id = $_GET['id'] ?? null;
        $group_id = $_GET['group_id'] ?? null;
        
        if ($announcement_id) {
            // Get specific announcement and mark as viewed
            $stmt = $pdo->prepare("
                SELECT a.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT al.id) as likes_count,
                       COUNT(DISTINCT ac.id) as comments_count,
                       COUNT(DISTINCT av.id) as views_count,
                       EXISTS(SELECT 1 FROM announcement_likes WHERE announcement_id = a.id AND user_id = ?) as user_liked
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN announcement_likes al ON a.id = al.announcement_id
                LEFT JOIN announcement_comments ac ON a.id = ac.announcement_id
                LEFT JOIN announcement_views av ON a.id = av.announcement_id
                WHERE a.id = ? AND a.is_archived = 0
                GROUP BY a.id
            ");
            $stmt->execute([$userId, $announcement_id]);
            $announcement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => 'Announcement not found']);
                return;
            }
            
            // Check if user has access to this announcement
            $targetGroups = json_decode($announcement['target_groups'], true) ?? [];
            if (!empty($targetGroups) && !userHasAccessToGroups($userId, $targetGroups)) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            // Mark as viewed
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO announcement_views (announcement_id, user_id, viewed_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$announcement_id, $userId]);
            
            // Update views count
            $stmt = $pdo->prepare("UPDATE announcements SET views_count = views_count + 1 WHERE id = ?");
            $stmt->execute([$announcement_id]);
            
            // Parse JSON fields
            $announcement['target_groups'] = $targetGroups;
            $announcement['attachments'] = json_decode($announcement['attachments'], true) ?? [];
            $announcement['images'] = json_decode($announcement['images'], true) ?? [];
            
            // Get comments with replies
            $announcement['comments'] = getAnnouncementComments($announcement_id, $userId);
            
            echo json_encode([
                'success' => true,
                'data' => $announcement
            ]);
            
        } else {
            // Get announcements for user's groups
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            
            // Get user's group IDs
            $stmt = $pdo->prepare("
                SELECT group_id FROM group_members 
                WHERE user_id = ? AND is_active = 1
            ");
            $stmt->execute([$userId]);
            $userGroupIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($userGroupIds)) {
                echo json_encode([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'page' => (int)$page,
                        'limit' => (int)$limit,
                        'total' => 0,
                        'pages' => 0
                    ]
                ]);
                return;
            }
            
            $whereClause = "WHERE a.is_archived = 0 AND (";
            $params = [];
            
            // Build condition for group access
            $conditions = [];
            foreach ($userGroupIds as $groupId) {
                $conditions[] = "JSON_CONTAINS(a.target_groups, ?)";
                $params[] = json_encode([(int)$groupId]);
            }
            $whereClause .= implode(' OR ', $conditions) . ")";
            
            // Filter by specific group if requested
            if ($group_id && in_array($group_id, $userGroupIds)) {
                $whereClause = "WHERE a.is_archived = 0 AND JSON_CONTAINS(a.target_groups, ?)";
                $params = [json_encode([(int)$group_id])];
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
                       EXISTS(SELECT 1 FROM announcement_likes WHERE announcement_id = a.id AND user_id = ?) as user_liked,
                       EXISTS(SELECT 1 FROM announcement_views WHERE announcement_id = a.id AND user_id = ?) as user_viewed
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN announcement_likes al ON a.id = al.announcement_id
                LEFT JOIN announcement_comments ac ON a.id = ac.announcement_id
                $whereClause
                GROUP BY a.id
                ORDER BY a.is_pinned DESC, a.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, $userId, ...$params, $limit, $offset]);
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields for each announcement
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

function handlePost($input, $userId) {
    global $pdo;
    
    $action = $input['action'] ?? '';
    
    try {
        switch ($action) {
            case 'like':
                return handleLike($input, $userId);
            case 'comment':
                return handleComment($input, $userId);
            case 'reply':
                return handleReply($input, $userId);
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

function handleLike($input, $userId) {
    global $pdo;
    
    if (!isset($input['announcement_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID is required']);
        return;
    }
    
    $announcementId = (int)$input['announcement_id'];
    $isLike = isset($input['is_like']) ? (bool)$input['is_like'] : true;
    
    try {
        if ($isLike) {
            // Add like
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO announcement_likes (announcement_id, user_id, created_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$announcementId, $userId]);
        } else {
            // Remove like
            $stmt = $pdo->prepare("
                DELETE FROM announcement_likes 
                WHERE announcement_id = ? AND user_id = ?
            ");
            $stmt->execute([$announcementId, $userId]);
        }
        
        // Get updated like count
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM announcement_likes WHERE announcement_id = ?
        ");
        $stmt->execute([$announcementId]);
        $likesCount = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'likes_count' => (int)$likesCount,
                'user_liked' => $isLike
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
    
    if (!isset($input['announcement_id']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID and content are required']);
        return;
    }
    
    $announcementId = (int)$input['announcement_id'];
    $content = trim($input['content']);
    
    if (empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Content cannot be empty']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO announcement_comments (announcement_id, user_id, content, created_at, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$announcementId, $userId, $content]);
        
        $commentId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$commentId,
                'content' => $content
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleComment: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleReply($input, $userId) {
    global $pdo;
    
    if (!isset($input['announcement_id']) || !isset($input['parent_comment_id']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID, parent comment ID, and content are required']);
        return;
    }
    
    $announcementId = (int)$input['announcement_id'];
    $parentCommentId = (int)$input['parent_comment_id'];
    $content = trim($input['content']);
    
    if (empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Content cannot be empty']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO announcement_comments (announcement_id, user_id, parent_comment_id, content, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$announcementId, $userId, $parentCommentId, $content]);
        
        $replyId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$replyId,
                'content' => $content,
                'parent_comment_id' => $parentCommentId
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleReply: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function userHasAccessToGroups($userId, $targetGroups) {
    global $pdo;
    
    if (empty($targetGroups)) return true;
    
    $groupIds = implode(',', array_map('intval', $targetGroups));
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM group_members 
        WHERE user_id = ? AND group_id IN ($groupIds) AND is_active = 1
    ");
    $stmt->execute([$userId]);
    
    return $stmt->fetchColumn() > 0;
}

function getAnnouncementComments($announcementId, $userId) {
    global $pdo;
    
    // Get comments and replies
    $stmt = $pdo->prepare("
        SELECT ac.*, u.email, up.name as author_name
        FROM announcement_comments ac
        LEFT JOIN users u ON ac.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE ac.announcement_id = ?
        ORDER BY ac.parent_comment_id IS NULL DESC, ac.created_at ASC
    ");
    $stmt->execute([$announcementId]);
    $allComments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organize comments and replies
    $comments = [];
    $replies = [];
    
    foreach ($allComments as $comment) {
        if ($comment['parent_comment_id'] === null) {
            $comment['replies'] = [];
            $comments[$comment['id']] = $comment;
        } else {
            $replies[$comment['parent_comment_id']][] = $comment;
        }
    }
    
    // Attach replies to comments
    foreach ($replies as $parentId => $parentReplies) {
        if (isset($comments[$parentId])) {
            $comments[$parentId]['replies'] = $parentReplies;
        }
    }
    
    return array_values($comments);
}
?>
