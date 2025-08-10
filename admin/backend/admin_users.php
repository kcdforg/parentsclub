<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

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

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get pagination parameters
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = 10; // Items per page
            $offset = ($page - 1) * $limit;
            
            // Get filter parameters
            $statusFilter = $_GET['status'] ?? '';
            $searchFilter = $_GET['search'] ?? '';
            
            // Build WHERE clause
            $whereConditions = [];
            $params = [];
            
            if ($statusFilter !== '') {
                $whereConditions[] = "a.is_active = ?";
                $params[] = $statusFilter === 'active' ? 1 : 0;
            }
            
            if ($searchFilter !== '') {
                $whereConditions[] = "(a.username LIKE ? OR a.email LIKE ?)";
                $params[] = "%$searchFilter%";
                $params[] = "%$searchFilter%";
            }
            
            $whereClause = '';
            if (!empty($whereConditions)) {
                $whereClause = "WHERE " . implode(" AND ", $whereConditions);
            }
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) FROM admin_users a $whereClause");
            $countStmt->execute($params);
            $totalCount = $countStmt->fetchColumn();
            
            // Get admin users with pagination
            $stmt = $db->prepare("
                SELECT a.id, a.username, a.email, a.created_at, a.is_active,
                       ca.username as created_by_username
                FROM admin_users a
                LEFT JOIN admin_users ca ON a.created_by = ca.id
                $whereClause
                ORDER BY a.created_at DESC
                LIMIT $limit OFFSET $offset
            ");
            $stmt->execute($params);
            $adminUsers = $stmt->fetchAll();
            
            // Calculate pagination info
            $totalPages = ceil($totalCount / $limit);
            $start = $offset + 1;
            $end = min($offset + $limit, $totalCount);
            
            echo json_encode([
                'success' => true,
                'admin_users' => $adminUsers,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'total' => $totalCount,
                    'start' => $start,
                    'end' => $end,
                    'limit' => $limit
                ]
            ]);
            break;
            
        case 'POST':
            // Create new admin user
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['username']) || !isset($input['password']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Username, password, and email are required']);
                exit;
            }
            
            $username = trim($input['username']);
            $password = $input['password'];
            $email = trim($input['email']);
            
            if (empty($username) || empty($password) || empty($email)) {
                http_response_code(400);
                echo json_encode(['error' => 'All fields are required']);
                exit;
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }
            
            if (strlen($password) < 6) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 6 characters']);
                exit;
            }
            
            // Check if username or email already exists
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Username or email already exists']);
                exit;
            }
            
            $hashedPassword = md5($password);
            
            $stmt = $db->prepare("
                INSERT INTO admin_users (username, password, email, created_by) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$username, $hashedPassword, $email, $admin['id']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Admin user created successfully'
            ]);
            break;
            
        case 'PUT':
            // Update admin user (change password, toggle active status, or update profile)
            $input = json_decode(file_get_contents('php://input'), true);
            $adminId = $input['admin_id'] ?? null;
            $action = $input['action'] ?? 'update_profile'; // Default to profile update
            
            if (!$adminId) {
                http_response_code(400);
                echo json_encode(['error' => 'Admin ID is required']);
                exit;
            }
            
            if ($action === 'update_profile') {
                // Update basic profile information
                $username = trim($input['username'] ?? '');
                $email = trim($input['email'] ?? '');
                $isActive = isset($input['is_active']) ? (int)$input['is_active'] : null;
                
                if (empty($username) || empty($email)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Username and email are required']);
                    exit;
                }
                
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid email format']);
                    exit;
                }
                
                // Check if username or email already exists (excluding current user)
                $stmt = $db->prepare("SELECT id FROM admin_users WHERE (username = ? OR email = ?) AND id != ?");
                $stmt->execute([$username, $email, $adminId]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Username or email already exists']);
                    exit;
                }
                
                // Update the admin user
                $updateFields = ['username = ?', 'email = ?'];
                $updateParams = [$username, $email];
                
                if ($isActive !== null) {
                    $updateFields[] = 'is_active = ?';
                    $updateParams[] = $isActive;
                }
                
                $updateParams[] = $adminId;
                
                $stmt = $db->prepare("UPDATE admin_users SET " . implode(', ', $updateFields) . " WHERE id = ?");
                $stmt->execute($updateParams);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Admin user updated successfully'
                ]);
                
            } elseif ($action === 'change_password') {
                // Only allow changing own password or if current user is the original admin
                if ($admin['id'] != $adminId && $admin['username'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Permission denied']);
                    exit;
                }
                
                $newPassword = $input['new_password'] ?? '';
                $currentPassword = $input['current_password'] ?? '';
                
                if (empty($newPassword) || strlen($newPassword) < 6) {
                    http_response_code(400);
                    echo json_encode(['error' => 'New password must be at least 6 characters']);
                    exit;
                }
                
                // Verify current password
                $stmt = $db->prepare("SELECT password FROM admin_users WHERE id = ?");
                $stmt->execute([$adminId]);
                $currentAdmin = $stmt->fetch();
                
                if (!$currentAdmin || md5($currentPassword) !== $currentAdmin['password']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Current password is incorrect']);
                    exit;
                }
                
                $hashedPassword = md5($newPassword);
                $stmt = $db->prepare("UPDATE admin_users SET password = ? WHERE id = ?");
                $stmt->execute([$hashedPassword, $adminId]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Password updated successfully'
                ]);
                
            } elseif ($action === 'toggle_status') {
                // Prevent deactivating the original admin
                $stmt = $db->prepare("SELECT username FROM admin_users WHERE id = ?");
                $stmt->execute([$adminId]);
                $targetAdmin = $stmt->fetch();
                
                if ($targetAdmin['username'] === 'admin') {
                    http_response_code(400);
                    echo json_encode(['error' => 'Cannot deactivate the main admin user']);
                    exit;
                }
                
                $stmt = $db->prepare("UPDATE admin_users SET is_active = NOT is_active WHERE id = ?");
                $stmt->execute([$adminId]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Admin status updated successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        case 'DELETE':
            // Delete admin user (only if not the original admin)
            $input = json_decode(file_get_contents('php://input'), true);
            $adminId = $input['admin_id'] ?? null;
            
            if (!$adminId) {
                http_response_code(400);
                echo json_encode(['error' => 'Admin ID is required']);
                exit;
            }
            
            // Check if it's the original admin
            $stmt = $db->prepare("SELECT username FROM admin_users WHERE id = ?");
            $stmt->execute([$adminId]);
            $targetAdmin = $stmt->fetch();
            
            if (!$targetAdmin) {
                http_response_code(404);
                echo json_encode(['error' => 'Admin user not found']);
                exit;
            }
            
            if ($targetAdmin['username'] === 'admin') {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete the main admin user']);
                exit;
            }
            
            $stmt = $db->prepare("DELETE FROM admin_users WHERE id = ?");
            $stmt->execute([$adminId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Admin user deleted successfully'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Admin users API error: " . $e->getMessage());
}
?>
