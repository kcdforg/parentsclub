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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        listPasswordResetRequests();
        break;
    case 'PUT':
        handlePasswordResetAction();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function listPasswordResetRequests() {
    global $db;
    
    try {
        // Get query parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $statusFilter = isset($_GET['status']) ? $_GET['status'] : 'pending';
        $searchFilter = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        // Build WHERE clause
        $whereConditions = [];
        $params = [];
        
        if (!empty($statusFilter) && $statusFilter !== 'all') {
            $whereConditions[] = "prr.status = ?";
            $params[] = $statusFilter;
        }
        
        if (!empty($searchFilter)) {
            $whereConditions[] = "(u.email LIKE ? OR up.full_name LIKE ? OR u.enrollment_number LIKE ?)";
            $searchParam = "%{$searchFilter}%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get total count
        $countSql = "
            SELECT COUNT(*) 
            FROM password_reset_requests prr
            JOIN users u ON prr.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            {$whereClause}
        ";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = $countStmt->fetchColumn();
        
        // Get requests
        $sql = "
            SELECT prr.*, u.email, u.enrollment_number, u.profile_completed, u.approval_status,
                   up.full_name, up.profile_completed as user_profile_completed,
                   admin.username as approved_by_username
            FROM password_reset_requests prr
            JOIN users u ON prr.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN admin_users admin ON prr.approved_by = admin.id
            {$whereClause}
            ORDER BY prr.requested_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll();
        
        // Format the data
        $formattedRequests = array_map(function($request) {
            // Determine user type
            $userType = 'Registered';
            if ($request['user_profile_completed']) {
                $userType = 'Enrolled';
                if ($request['approval_status'] === 'approved') {
                    $userType = 'Approved';
                    // TODO: Check for subscription to determine if Member
                }
            }
            
            return [
                'id' => $request['id'],
                'user_id' => $request['user_id'],
                'email' => $request['email'],
                'full_name' => $request['full_name'] ?? 'N/A',
                'enrollment_number' => $request['enrollment_number'],
                'user_type' => $userType,
                'status' => $request['status'],
                'requested_at' => $request['requested_at'],
                'approved_at' => $request['approved_at'],
                'approved_by' => $request['approved_by_username'],
                'ip_address' => $request['ip_address'],
                'user_agent' => substr($request['user_agent'], 0, 100) . (strlen($request['user_agent']) > 100 ? '...' : ''),
                'reset_token_expires' => $request['reset_token_expires']
            ];
        }, $requests);
        
        // Calculate pagination
        $totalPages = ceil($totalCount / $limit);
        
        echo json_encode([
            'success' => true,
            'requests' => $formattedRequests,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_count' => $totalCount,
                'per_page' => $limit
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error listing password reset requests: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to load password reset requests']);
    }
}

function handlePasswordResetAction() {
    global $db, $admin;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['request_id']) || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Request ID and action are required']);
            return;
        }
        
        $requestId = intval($input['request_id']);
        $action = $input['action'];
        
        if (!in_array($action, ['approve', 'reject'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action. Must be "approve" or "reject"']);
            return;
        }
        
        // Get the request
        $stmt = $db->prepare("
            SELECT prr.*, u.email, up.full_name
            FROM password_reset_requests prr
            JOIN users u ON prr.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE prr.id = ? AND prr.status = 'pending'
        ");
        $stmt->execute([$requestId]);
        $request = $stmt->fetch();
        
        if (!$request) {
            http_response_code(404);
            echo json_encode(['error' => 'Request not found or already processed']);
            return;
        }
        
        $db->beginTransaction();
        
        try {
            if ($action === 'approve') {
                // Generate reset token
                $resetToken = bin2hex(random_bytes(32));
                $resetExpires = date('Y-m-d H:i:s', strtotime('+24 hours')); // 24 hour expiry
                
                // Update request
                $stmt = $db->prepare("
                    UPDATE password_reset_requests 
                    SET status = 'approved', approved_at = NOW(), approved_by = ?, 
                        reset_token = ?, reset_token_expires = ?
                    WHERE id = ?
                ");
                $stmt->execute([$admin['user_id'], $resetToken, $resetExpires, $requestId]);
                
                // Also update the user table for compatibility
                $stmt = $db->prepare("
                    UPDATE users 
                    SET password_reset_token = ?, password_reset_expires = ?
                    WHERE id = ?
                ");
                $stmt->execute([$resetToken, $resetExpires, $request['user_id']]);
                
                $message = 'Password reset request approved. Reset link generated.';
                $resetLink = "http://localhost/regapp2/public/frontend/reset_password.html?token=" . $resetToken;
                
            } else { // reject
                $stmt = $db->prepare("
                    UPDATE password_reset_requests 
                    SET status = 'rejected', approved_at = NOW(), approved_by = ?
                    WHERE id = ?
                ");
                $stmt->execute([$admin['user_id'], $requestId]);
                
                $message = 'Password reset request rejected.';
                $resetLink = null;
            }
            
            $db->commit();
            
            // Log the action
            error_log("Admin {$admin['username']} {$action}d password reset request for user: {$request['email']} (Request ID: {$requestId}) at " . date('Y-m-d H:i:s'));
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'reset_link' => $resetLink,
                'user_email' => $request['email'],
                'user_name' => $request['full_name'] ?? 'User'
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        error_log("Error handling password reset action: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process password reset action']);
    }
}
?>
