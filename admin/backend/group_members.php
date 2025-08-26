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
    error_log("Group Members API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $group_id = $_GET['group_id'] ?? null;
        $search = $_GET['search'] ?? '';
        
        if (!$group_id) {
            // Search for users to add to group
            $whereClause = "WHERE u.approval_status = 'approved' AND u.is_active = 1";
            $params = [];
            
            if ($search) {
                $whereClause .= " AND (up.name LIKE ? OR u.email LIKE ? OR up.phone LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $stmt = $pdo->prepare("
                SELECT u.id, u.email, up.name as full_name, up.phone, up.district, up.post_office_area
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                $whereClause
                ORDER BY up.name ASC
                LIMIT 50
            ");
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $users
            ]);
        } else {
            // Get members of a specific group
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE gm.group_id = ? AND gm.is_active = 1";
            $params = [$group_id];
            
            if ($search) {
                $whereClause .= " AND (up.name LIKE ? OR u.email LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get members
            $stmt = $pdo->prepare("
                SELECT gm.*, u.email, up.name as full_name, up.phone, 
                       au.username as added_by_name, gm.joined_at
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN admin_users au ON gm.added_by = au.id
                $whereClause
                ORDER BY gm.role DESC, up.name ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $members,
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
    
    if (!isset($input['group_id']) || !isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Group ID and User ID are required']);
        return;
    }
    
    $group_id = (int)$input['group_id'];
    $user_id = (int)$input['user_id'];
    $role = $input['role'] ?? 'member';
    
    if (!in_array($role, ['member', 'moderator', 'admin'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role']);
        return;
    }
    
    try {
        // Check if group exists
        $stmt = $pdo->prepare("SELECT id FROM groups WHERE id = ? AND is_active = 1");
        $stmt->execute([$group_id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }
        
        // Check if user exists and is approved
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND approval_status = 'approved' AND is_active = 1");
        $stmt->execute([$user_id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found or not approved']);
            return;
        }
        
        // Check if user is already in group
        $stmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND is_active = 1");
        $stmt->execute([$group_id, $user_id]);
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'User is already a member of this group']);
            return;
        }
        
        // Add user to group
        $stmt = $pdo->prepare("
            INSERT INTO group_members (group_id, user_id, role, added_by, joined_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$group_id, $user_id, $role, $adminId]);
        
        $memberId = $pdo->lastInsertId();
        
        // Create notification for user
        createNotification($user_id, 'group_added', 'Added to Group', 'You have been added to a group', 'group', $group_id);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$memberId,
                'group_id' => $group_id,
                'user_id' => $user_id,
                'role' => $role
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in handlePost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handlePut($input, $adminId) {
    global $pdo;
    
    if (!isset($input['id']) || !isset($input['role'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Member ID and role are required']);
        return;
    }
    
    $id = (int)$input['id'];
    $role = $input['role'];
    
    if (!in_array($role, ['member', 'moderator', 'admin'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role']);
        return;
    }
    
    try {
        // Check if member exists
        $stmt = $pdo->prepare("SELECT id FROM group_members WHERE id = ? AND is_active = 1");
        $stmt->execute([$id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Group member not found']);
            return;
        }
        
        // Update member role
        $stmt = $pdo->prepare("UPDATE group_members SET role = ? WHERE id = ?");
        $stmt->execute([$role, $id]);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $id,
                'role' => $role
            ]
        ]);
        
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
        echo json_encode(['error' => 'Member ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        // Remove member from group (soft delete)
        $stmt = $pdo->prepare("UPDATE group_members SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Group member not found']);
            return;
        }
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function createNotification($userId, $type, $title, $message, $referenceType = null, $referenceId = null) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $type, $title, $message, $referenceType, $referenceId]);
    } catch (PDOException $e) {
        error_log("Error creating notification: " . $e->getMessage());
    }
}
?>
