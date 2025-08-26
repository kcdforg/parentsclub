<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

try {
    switch ($method) {
        case 'GET':
            handleGet($user['id']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("User Groups API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet($userId) {
    global $pdo;
    
    try {
        $group_id = $_GET['id'] ?? null;
        
        if ($group_id) {
            // Get specific group details if user is a member
            $stmt = $pdo->prepare("
                SELECT g.*, gm.role as user_role,
                       COUNT(DISTINCT gm_all.id) as member_count
                FROM groups g 
                JOIN group_members gm ON g.id = gm.group_id 
                LEFT JOIN group_members gm_all ON g.id = gm_all.group_id AND gm_all.is_active = 1
                WHERE g.id = ? AND g.is_active = 1 AND gm.user_id = ? AND gm.is_active = 1
                GROUP BY g.id
            ");
            $stmt->execute([$group_id, $userId]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$group) {
                http_response_code(404);
                echo json_encode(['error' => 'Group not found or access denied']);
                return;
            }
            
            // Get recent announcements for this group
            $stmt = $pdo->prepare("
                SELECT a.*, u.email as created_by_email, up.name as created_by_name
                FROM announcements a
                JOIN users u ON a.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE JSON_CONTAINS(a.target_groups, ?) AND a.is_archived = 0
                ORDER BY a.is_pinned DESC, a.created_at DESC
                LIMIT 5
            ");
            $stmt->execute([json_encode([(int)$group_id])]);
            $group['recent_announcements'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get upcoming events for this group
            $stmt = $pdo->prepare("
                SELECT e.*, u.email as created_by_email, up.name as created_by_name
                FROM events e
                JOIN users u ON e.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE JSON_CONTAINS(e.target_groups, ?) AND e.event_date >= CURDATE() AND e.is_cancelled = 0
                ORDER BY e.event_date ASC, e.event_time ASC
                LIMIT 5
            ");
            $stmt->execute([json_encode([(int)$group_id])]);
            $group['upcoming_events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $group
            ]);
        } else {
            // Get all groups user is a member of
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $search = $_GET['search'] ?? '';
            $type = $_GET['type'] ?? '';
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE g.is_active = 1 AND gm.user_id = ? AND gm.is_active = 1";
            $params = [$userId];
            
            if ($search) {
                $whereClause .= " AND (g.name LIKE ? OR g.description LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($type) {
                $whereClause .= " AND g.type = ?";
                $params[] = $type;
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM groups g 
                JOIN group_members gm ON g.id = gm.group_id 
                $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get user's groups
            $stmt = $pdo->prepare("
                SELECT g.*, gm.role as user_role, gm.joined_at,
                       COUNT(DISTINCT gm_all.id) as member_count
                FROM groups g 
                JOIN group_members gm ON g.id = gm.group_id 
                LEFT JOIN group_members gm_all ON g.id = gm_all.group_id AND gm_all.is_active = 1
                $whereClause
                GROUP BY g.id
                ORDER BY g.type ASC, g.name ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get statistics for each group
            foreach ($groups as &$group) {
                // Count unread announcements
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) 
                    FROM announcements a
                    LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.user_id = ?
                    WHERE JSON_CONTAINS(a.target_groups, ?) 
                    AND a.is_archived = 0 
                    AND av.id IS NULL
                ");
                $stmt->execute([$userId, json_encode([(int)$group['id']])]);
                $group['unread_announcements'] = (int)$stmt->fetchColumn();
                
                // Count upcoming events
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) 
                    FROM events e
                    WHERE JSON_CONTAINS(e.target_groups, ?) 
                    AND e.event_date >= CURDATE() 
                    AND e.is_cancelled = 0
                ");
                $stmt->execute([json_encode([(int)$group['id']])]);
                $group['upcoming_events_count'] = (int)$stmt->fetchColumn();
            }
            
            echo json_encode([
                'success' => true,
                'data' => $groups,
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
?>
