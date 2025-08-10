<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Check if it's a GET request (list users) or POST/PUT (update user)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    listUsers();
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    updateUserStatus();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function listUsers() {
    try {
        // Verify admin session
        $sessionToken = getAuthorizationToken();
        if (!$sessionToken) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $sessionManager = SessionManager::getInstance();
        $session = $sessionManager->validateSession($sessionToken);
        if (!$session || $session['user_type'] !== 'admin') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $db = Database::getInstance()->getConnection();
        
        // Get query parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $statusFilter = isset($_GET['status']) ? $_GET['status'] : '';
        $searchFilter = isset($_GET['search']) ? $_GET['search'] : '';
        
        // Build WHERE clause
        $whereConditions = [];
        $params = [];
        
        if ($statusFilter) {
            $whereConditions[] = "u.approval_status = ?";
            $params[] = $statusFilter;
        }
        
        if ($searchFilter) {
            $whereConditions[] = "(up.full_name LIKE ? OR u.email LIKE ? OR u.enrollment_number LIKE ?)";
            $searchTerm = "%{$searchFilter}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Count total users
        $countSql = "SELECT COUNT(*) FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id {$whereClause}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalUsers = $countStmt->fetchColumn();
        
        // Get users with pagination
        $sql = "SELECT u.*, up.full_name, up.profile_completed 
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id 
                {$whereClause}
                ORDER BY u.created_at DESC 
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate pagination info
        $totalPages = ceil($totalUsers / $limit);
        $start = $offset + 1;
        $end = min($offset + $limit, $totalUsers);
        
        echo json_encode([
            'success' => true,
            'users' => $users,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total' => $totalUsers,
                'start' => $start,
                'end' => $end,
                'limit' => $limit
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
        error_log("Error listing users: " . $e->getMessage());
    }
}

function updateUserStatus() {
    try {
        // Verify admin session
        $sessionToken = getAuthorizationToken();
        if (!$sessionToken) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $sessionManager = SessionManager::getInstance();
        $session = $sessionManager->validateSession($sessionToken);
        if (!$session || $session['user_type'] !== 'admin') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['user_id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and status are required']);
            return;
        }
        
        $userId = intval($input['user_id']);
        $status = $input['status'];
        $notes = isset($input['notes']) ? $input['notes'] : '';
        
        // Validate status
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            return;
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Update user status
        $sql = "UPDATE users SET approval_status = ?, approved_at = ?, approved_by = ? WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $status,
            $status === 'pending' ? null : date('Y-m-d H:i:s'),
            $session['user_id'],
            $userId
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'User status updated successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
        error_log("Error updating user status: " . $e->getMessage());
    }
}

function getAuthorizationToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') === 0) {
            return substr($auth, 7);
        }
    }
    return null;
}
?>
