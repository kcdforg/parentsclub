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
    error_log("Groups API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $group_id = $_GET['id'] ?? null;
        
        if ($group_id) {
            // Get specific group with member count
            $stmt = $pdo->prepare("
                SELECT g.*, 
                       COUNT(gm.id) as member_count,
                       au.username as created_by_name
                FROM groups g 
                LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = 1
                LEFT JOIN admin_users au ON g.created_by = au.id
                WHERE g.id = ? AND g.is_active = 1
                GROUP BY g.id
            ");
            $stmt->execute([$group_id]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$group) {
                http_response_code(404);
                echo json_encode(['error' => 'Group not found']);
                return;
            }
            
            // Get group members
            $stmt = $pdo->prepare("
                SELECT gm.*, u.email, up.name as full_name, up.phone
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE gm.group_id = ? AND gm.is_active = 1
                ORDER BY gm.role DESC, up.name ASC
            ");
            $stmt->execute([$group_id]);
            $group['members'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $group
            ]);
        } else {
            // Get all groups with pagination
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $search = $_GET['search'] ?? '';
            $type = $_GET['type'] ?? '';
            
            $offset = ($page - 1) * $limit;
            
            $whereClause = "WHERE g.is_active = 1";
            $params = [];
            
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
                SELECT COUNT(*) FROM groups g $whereClause
            ");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Get groups
            $stmt = $pdo->prepare("
                SELECT g.*, 
                       COUNT(gm.id) as member_count,
                       au.username as created_by_name
                FROM groups g 
                LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = 1
                LEFT JOIN admin_users au ON g.created_by = au.id
                $whereClause
                GROUP BY g.id
                ORDER BY g.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([...$params, $limit, $offset]);
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
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

function handlePost($input, $adminId) {
    global $pdo;
    
    if (!isset($input['name']) || empty(trim($input['name']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Group name is required']);
        return;
    }
    
    if (!isset($input['type']) || !in_array($input['type'], ['district', 'area', 'custom'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid group type is required']);
        return;
    }
    
    $name = trim($input['name']);
    $description = trim($input['description'] ?? '');
    $type = $input['type'];
    $district = $input['district'] ?? null;
    $area = $input['area'] ?? null;
    $pin_code = $input['pin_code'] ?? null;
    
    try {
        $pdo->beginTransaction();
        
        // Check for duplicate names
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM groups WHERE name = ? AND is_active = 1");
        $stmt->execute([$name]);
        
        if ($stmt->fetchColumn() > 0) {
            $pdo->rollback();
            http_response_code(409);
            echo json_encode(['error' => 'A group with this name already exists']);
            return;
        }
        
        // Insert new group
        $stmt = $pdo->prepare("
            INSERT INTO groups (name, description, type, district, area, pin_code, created_by, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$name, $description, $type, $district, $area, $pin_code, $adminId]);
        
        $groupId = $pdo->lastInsertId();
        
        // Auto-assign users based on group type
        if ($type === 'district' && $district) {
            autoAssignUsersByDistrict($groupId, $district, $adminId);
        } elseif ($type === 'area' && $pin_code) {
            autoAssignUsersByPinCode($groupId, $pin_code, $adminId);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$groupId,
                'name' => $name,
                'description' => $description,
                'type' => $type
            ]
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Database error in handlePost: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function autoAssignUsersByDistrict($groupId, $district, $adminId) {
    global $pdo;
    
    // Find users in this district
    $stmt = $pdo->prepare("
        SELECT DISTINCT u.id 
        FROM users u 
        JOIN user_profiles up ON u.id = up.user_id 
        WHERE up.district = ? AND u.approval_status = 'approved' AND u.is_active = 1
    ");
    $stmt->execute([$district]);
    $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add users to group
    foreach ($userIds as $userId) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO group_members (group_id, user_id, role, added_by, joined_at) 
            VALUES (?, ?, 'member', ?, NOW())
        ");
        $stmt->execute([$groupId, $userId, $adminId]);
    }
}

function autoAssignUsersByPinCode($groupId, $pinCode, $adminId) {
    global $pdo;
    
    // Find users with this PIN code
    $stmt = $pdo->prepare("
        SELECT DISTINCT u.id 
        FROM users u 
        JOIN user_profiles up ON u.id = up.user_id 
        WHERE up.pin_code = ? AND u.approval_status = 'approved' AND u.is_active = 1
    ");
    $stmt->execute([$pinCode]);
    $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add users to group
    foreach ($userIds as $userId) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO group_members (group_id, user_id, role, added_by, joined_at) 
            VALUES (?, ?, 'member', ?, NOW())
        ");
        $stmt->execute([$groupId, $userId, $adminId]);
    }
}

function handlePut($input, $adminId) {
    global $pdo;
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Group ID is required']);
        return;
    }
    
    $id = (int)$input['id'];
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Group name is required']);
        return;
    }
    
    try {
        // Check if group exists
        $stmt = $pdo->prepare("SELECT id FROM groups WHERE id = ? AND is_active = 1");
        $stmt->execute([$id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }
        
        // Check for duplicate names (excluding current group)
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM groups WHERE name = ? AND id != ? AND is_active = 1");
        $stmt->execute([$name, $id]);
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'A group with this name already exists']);
            return;
        }
        
        // Update group
        $stmt = $pdo->prepare("
            UPDATE groups 
            SET name = ?, description = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$name, $description, $id]);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $id,
                'name' => $name,
                'description' => $description
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
        echo json_encode(['error' => 'Group ID is required']);
        return;
    }
    
    $id = (int)$_GET['id'];
    
    try {
        $pdo->beginTransaction();
        
        // Soft delete group
        $stmt = $pdo->prepare("UPDATE groups SET is_active = 0, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            $pdo->rollback();
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }
        
        // Remove all members from group
        $stmt = $pdo->prepare("UPDATE group_members SET is_active = 0 WHERE group_id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        $pdo->rollback();
        error_log("Database error in handleDelete: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}
?>
