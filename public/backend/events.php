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
    error_log("User Events API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet($userId) {
    global $pdo;
    
    try {
        $event_id = $_GET['id'] ?? null;
        $group_id = $_GET['group_id'] ?? null;
        $date_filter = $_GET['date_filter'] ?? 'upcoming'; // upcoming, past, all
        
        if ($event_id) {
            // Get specific event and mark as viewed
            $stmt = $pdo->prepare("
                SELECT e.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT er_attending.id) as attending_count,
                       COUNT(DISTINCT er_not_attending.id) as not_attending_count,
                       COUNT(DISTINCT er_maybe.id) as maybe_count,
                       COUNT(DISTINCT ev.id) as views_count,
                       er_user.status as user_rsvp_status,
                       er_user.notes as user_rsvp_notes
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN event_rsvps er_attending ON e.id = er_attending.event_id AND er_attending.status = 'attending'
                LEFT JOIN event_rsvps er_not_attending ON e.id = er_not_attending.event_id AND er_not_attending.status = 'not_attending'
                LEFT JOIN event_rsvps er_maybe ON e.id = er_maybe.event_id AND er_maybe.status = 'maybe'
                LEFT JOIN event_views ev ON e.id = ev.event_id
                LEFT JOIN event_rsvps er_user ON e.id = er_user.event_id AND er_user.user_id = ?
                WHERE e.id = ? AND e.is_cancelled = 0
                GROUP BY e.id
            ");
            $stmt->execute([$userId, $event_id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                return;
            }
            
            // Check if user has access to this event
            $targetGroups = json_decode($event['target_groups'], true) ?? [];
            if (!empty($targetGroups) && !userHasAccessToGroups($userId, $targetGroups)) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            // Mark as viewed
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO event_views (event_id, user_id, viewed_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$event_id, $userId]);
            
            // Update views count
            $stmt = $pdo->prepare("UPDATE events SET views_count = views_count + 1 WHERE id = ?");
            $stmt->execute([$event_id]);
            
            // Parse JSON fields
            $event['target_groups'] = $targetGroups;
            $event['attachments'] = json_decode($event['attachments'], true) ?? [];
            $event['images'] = json_decode($event['images'], true) ?? [];
            
            // Get RSVP details if user can view them
            if ($event['created_by'] == $userId || isUserGroupAdmin($userId, $targetGroups)) {
                $stmt = $pdo->prepare("
                    SELECT er.*, u.email, up.name as attendee_name
                    FROM event_rsvps er
                    LEFT JOIN users u ON er.user_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE er.event_id = ?
                    ORDER BY er.status, up.name ASC
                ");
                $stmt->execute([$event_id]);
                $event['rsvp_details'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $event
            ]);
            
        } else {
            // Get events for user's groups
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
            
            $whereClause = "WHERE e.is_cancelled = 0 AND (";
            $params = [];
            
            // Build condition for group access
            $conditions = [];
            foreach ($userGroupIds as $groupId) {
                $conditions[] = "JSON_CONTAINS(e.target_groups, ?)";
                $params[] = json_encode([(int)$groupId]);
            }
            $whereClause .= implode(' OR ', $conditions) . ")";
            
            // Filter by specific group if requested
            if ($group_id && in_array($group_id, $userGroupIds)) {
                $whereClause = "WHERE e.is_cancelled = 0 AND JSON_CONTAINS(e.target_groups, ?)";
                $params = [json_encode([(int)$group_id])];
            }
            
            // Date filters
            switch ($date_filter) {
                case 'upcoming':
                    $whereClause .= " AND e.event_date >= CURDATE()";
                    break;
                case 'past':
                    $whereClause .= " AND e.event_date < CURDATE()";
                    break;
                case 'today':
                    $whereClause .= " AND e.event_date = CURDATE()";
                    break;
                case 'this_week':
                    $whereClause .= " AND e.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
                    break;
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) FROM events e $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get events
            $stmt = $pdo->prepare("
                SELECT e.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT er_attending.id) as attending_count,
                       COUNT(DISTINCT er_not_attending.id) as not_attending_count,
                       COUNT(DISTINCT er_maybe.id) as maybe_count,
                       er_user.status as user_rsvp_status,
                       EXISTS(SELECT 1 FROM event_views WHERE event_id = e.id AND user_id = ?) as user_viewed
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN event_rsvps er_attending ON e.id = er_attending.event_id AND er_attending.status = 'attending'
                LEFT JOIN event_rsvps er_not_attending ON e.id = er_not_attending.event_id AND er_not_attending.status = 'not_attending'
                LEFT JOIN event_rsvps er_maybe ON e.id = er_maybe.event_id AND er_maybe.status = 'maybe'
                LEFT JOIN event_rsvps er_user ON e.id = er_user.event_id AND er_user.user_id = ?
                $whereClause
                GROUP BY e.id
                ORDER BY e.event_date ASC, e.event_time ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, $userId, ...$params, $limit, $offset]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields for each event
            foreach ($events as &$event) {
                $event['target_groups'] = json_decode($event['target_groups'], true) ?? [];
                $event['attachments'] = json_decode($event['attachments'], true) ?? [];
                $event['images'] = json_decode($event['images'], true) ?? [];
                
                // Get target group names
                if (!empty($event['target_groups'])) {
                    $groupIds = implode(',', array_map('intval', $event['target_groups']));
                    $stmt = $pdo->prepare("SELECT id, name FROM groups WHERE id IN ($groupIds) AND is_active = 1");
                    $stmt->execute();
                    $event['target_group_names'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $event['target_group_names'] = [];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $events,
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
            case 'rsvp':
                return handleRSVP($input, $userId);
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

function handleRSVP($input, $userId) {
    global $pdo;
    
    if (!isset($input['event_id']) || !isset($input['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID and RSVP status are required']);
        return;
    }
    
    $eventId = (int)$input['event_id'];
    $status = $input['status'];
    $notes = trim($input['notes'] ?? '');
    
    if (!in_array($status, ['attending', 'not_attending', 'maybe'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid RSVP status']);
        return;
    }
    
    try {
        // Check if event exists and user has access
        $stmt = $pdo->prepare("
            SELECT e.*, 
                   COUNT(DISTINCT er_attending.id) as attending_count
            FROM events e
            LEFT JOIN event_rsvps er_attending ON e.id = er_attending.event_id AND er_attending.status = 'attending'
            WHERE e.id = ? AND e.is_cancelled = 0
            GROUP BY e.id
        ");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            return;
        }
        
        // Check if event is in the past
        $eventDateTime = new DateTime($event['event_date'] . ' ' . $event['event_time']);
        $now = new DateTime();
        if ($eventDateTime < $now) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot RSVP to past events']);
            return;
        }
        
        // Check access to event
        $targetGroups = json_decode($event['target_groups'], true) ?? [];
        if (!empty($targetGroups) && !userHasAccessToGroups($userId, $targetGroups)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // Check max attendees limit
        if ($status === 'attending' && $event['max_attendees'] && $event['attending_count'] >= $event['max_attendees']) {
            // Check if user is already attending (allowing status change)
            $stmt = $pdo->prepare("SELECT status FROM event_rsvps WHERE event_id = ? AND user_id = ?");
            $stmt->execute([$eventId, $userId]);
            $currentStatus = $stmt->fetchColumn();
            
            if ($currentStatus !== 'attending') {
                http_response_code(400);
                echo json_encode(['error' => 'Event is full']);
                return;
            }
        }
        
        // Insert or update RSVP
        $stmt = $pdo->prepare("
            INSERT INTO event_rsvps (event_id, user_id, status, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
        ");
        $stmt->execute([$eventId, $userId, $status, $notes]);
        
        // Get updated counts
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'attending' THEN 1 END) as attending_count,
                COUNT(CASE WHEN status = 'not_attending' THEN 1 END) as not_attending_count,
                COUNT(CASE WHEN status = 'maybe' THEN 1 END) as maybe_count
            FROM event_rsvps 
            WHERE event_id = ?
        ");
        $stmt->execute([$eventId]);
        $counts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'status' => $status,
                'notes' => $notes,
                'attending_count' => (int)$counts['attending_count'],
                'not_attending_count' => (int)$counts['not_attending_count'],
                'maybe_count' => (int)$counts['maybe_count']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleRSVP: " . $e->getMessage());
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

function isUserGroupAdmin($userId, $targetGroups) {
    global $pdo;
    
    if (empty($targetGroups)) return false;
    
    $groupIds = implode(',', array_map('intval', $targetGroups));
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM group_members 
        WHERE user_id = ? AND group_id IN ($groupIds) AND role IN ('admin', 'moderator') AND is_active = 1
    ");
    $stmt->execute([$userId]);
    
    return $stmt->fetchColumn() > 0;
}
?>
