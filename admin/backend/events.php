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
    error_log("Events API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $event_id = $_GET['id'] ?? null;
        
        if ($event_id) {
            // Get specific event with RSVP details
            $stmt = $pdo->prepare("
                SELECT e.*, u.email as created_by_email, up.name as created_by_name,
                       COUNT(DISTINCT er_attending.id) as attending_count,
                       COUNT(DISTINCT er_not_attending.id) as not_attending_count,
                       COUNT(DISTINCT er_maybe.id) as maybe_count,
                       COUNT(DISTINCT ev.id) as views_count
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN event_rsvps er_attending ON e.id = er_attending.event_id AND er_attending.status = 'attending'
                LEFT JOIN event_rsvps er_not_attending ON e.id = er_not_attending.event_id AND er_not_attending.status = 'not_attending'
                LEFT JOIN event_rsvps er_maybe ON e.id = er_maybe.event_id AND er_maybe.status = 'maybe'
                LEFT JOIN event_views ev ON e.id = ev.event_id
                WHERE e.id = ?
                GROUP BY e.id
            ");
            $stmt->execute([$event_id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                return;
            }
            
            // Parse JSON fields
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
            
            // Get RSVP details
            $stmt = $pdo->prepare("
                SELECT er.*, u.email, up.name as attendee_name
                FROM event_rsvps er
                LEFT JOIN users u ON er.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE er.event_id = ?
                ORDER BY er.status, up.name ASC
            ");
            $stmt->execute([$event_id]);
            $event['rsvps'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $event
            ]);
        } else {
            // Get all events with pagination and filters
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $search = $_GET['search'] ?? '';
            $group_id = $_GET['group_id'] ?? '';
            $date_filter = $_GET['date_filter'] ?? ''; // upcoming, past, today, this_week
            $status = $_GET['status'] ?? ''; // active, cancelled
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE 1=1";
            $params = [];
            
            if ($search) {
                $whereClause .= " AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($group_id) {
                $whereClause .= " AND JSON_CONTAINS(e.target_groups, ?)";
                $params[] = json_encode([(int)$group_id]);
            }
            
            if ($status === 'cancelled') {
                $whereClause .= " AND e.is_cancelled = 1";
            } elseif ($status === 'active') {
                $whereClause .= " AND e.is_cancelled = 0";
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
                       COUNT(DISTINCT ev.id) as views_count
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN event_rsvps er_attending ON e.id = er_attending.event_id AND er_attending.status = 'attending'
                LEFT JOIN event_rsvps er_not_attending ON e.id = er_not_attending.event_id AND er_not_attending.status = 'not_attending'
                LEFT JOIN event_rsvps er_maybe ON e.id = er_maybe.event_id AND er_maybe.status = 'maybe'
                LEFT JOIN event_views ev ON e.id = ev.event_id
                $whereClause
                GROUP BY e.id
                ORDER BY e.event_date ASC, e.event_time ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields and get group names for each event
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

function handlePost($input, $adminId) {
    global $pdo;
    
    if (!isset($input['title']) || empty(trim($input['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Title is required']);
        return;
    }
    
    if (!isset($input['description']) || empty(trim($input['description']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Description is required']);
        return;
    }
    
    if (!isset($input['event_date']) || empty($input['event_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event date is required']);
        return;
    }
    
    if (!isset($input['event_time']) || empty($input['event_time'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event time is required']);
        return;
    }
    
    $title = trim($input['title']);
    $description = trim($input['description']);
    $event_date = $input['event_date'];
    $event_time = $input['event_time'];
    $location = trim($input['location'] ?? '');
    $target_groups = $input['target_groups'] ?? [];
    $attachments = $input['attachments'] ?? [];
    $images = $input['images'] ?? [];
    $max_attendees = isset($input['max_attendees']) && $input['max_attendees'] > 0 ? (int)$input['max_attendees'] : null;
    $is_public = isset($input['is_public']) ? (bool)$input['is_public'] : true;
    
    // Validate date and time
    if (!validateDateTime($event_date, $event_time)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date or time format']);
        return;
    }
    
    // Check if event is in the past
    $eventDateTime = new DateTime("$event_date $event_time");
    $now = new DateTime();
    if ($eventDateTime < $now) {
        http_response_code(400);
        echo json_encode(['error' => 'Event cannot be scheduled in the past']);
        return;
    }
    
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
        
        // Insert event
        $stmt = $pdo->prepare("
            INSERT INTO events (title, description, event_date, event_time, location, created_by, target_groups, attachments, images, max_attendees, is_public, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $title, 
            $description, 
            $event_date,
            $event_time,
            $location,
            $adminId, 
            json_encode($target_groups),
            json_encode($attachments),
            json_encode($images),
            $max_attendees,
            $is_public
        ]);
        
        $eventId = $pdo->lastInsertId();
        
        // Create notifications for group members
        if (!empty($target_groups)) {
            createEventNotifications($eventId, $target_groups, $title);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$eventId,
                'title' => $title,
                'event_date' => $event_date,
                'event_time' => $event_time
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
        echo json_encode(['error' => 'Event ID is required']);
        return;
    }
    
    $id = (int)$input['id'];
    $action = $input['action'] ?? 'update';
    
    try {
        if ($action === 'cancel') {
            // Cancel event
            $is_cancelled = isset($input['is_cancelled']) ? (bool)$input['is_cancelled'] : true;
            
            $stmt = $pdo->prepare("UPDATE events SET is_cancelled = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$is_cancelled, $id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => ['id' => $id, 'is_cancelled' => $is_cancelled]
            ]);
            
        } else {
            // Update event content
            if (!isset($input['title']) || empty(trim($input['title']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                return;
            }
            
            if (!isset($input['description']) || empty(trim($input['description']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Description is required']);
                return;
            }
            
            $title = trim($input['title']);
            $description = trim($input['description']);
            $event_date = $input['event_date'];
            $event_time = $input['event_time'];
            $location = trim($input['location'] ?? '');
            $target_groups = $input['target_groups'] ?? [];
            $attachments = $input['attachments'] ?? [];
            $images = $input['images'] ?? [];
            $max_attendees = isset($input['max_attendees']) && $input['max_attendees'] > 0 ? (int)$input['max_attendees'] : null;
            $is_public = isset($input['is_public']) ? (bool)$input['is_public'] : true;
            
            // Validate date and time
            if (!validateDateTime($event_date, $event_time)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date or time format']);
                return;
            }
            
            $stmt = $pdo->prepare("
                UPDATE events 
                SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, target_groups = ?, attachments = ?, images = ?, max_attendees = ?, is_public = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([
                $title, 
                $description, 
                $event_date,
                $event_time,
                $location,
                json_encode($target_groups),
                json_encode($attachments),
                json_encode($images),
                $max_attendees,
                $is_public,
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'title' => $title,
                    'event_date' => $event_date,
                    'event_time' => $event_time
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
        echo json_encode(['error' => 'Event ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        $pdo->beginTransaction();
        
        // Delete related data
        $pdo->prepare("DELETE FROM event_rsvps WHERE event_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM event_views WHERE event_id = ?")->execute([$id]);
        
        // Delete event
        $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            $pdo->rollback();
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
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

function validateDateTime($date, $time) {
    $dateTime = DateTime::createFromFormat('Y-m-d H:i', "$date $time");
    return $dateTime && $dateTime->format('Y-m-d H:i') === "$date $time";
}

function createEventNotifications($eventId, $targetGroups, $title) {
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
            VALUES (?, 'event', ?, ?, 'event', ?, NOW())
        ");
        
        foreach ($userIds as $userId) {
            $notificationStmt->execute([
                $userId,
                'New Event',
                "New event: " . substr($title, 0, 100),
                $eventId
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Error creating event notifications: " . $e->getMessage());
    }
}
?>
