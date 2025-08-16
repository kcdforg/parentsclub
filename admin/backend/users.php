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
            $whereConditions[] = "(up.full_name LIKE ? OR u.email LIKE ? OR up.phone LIKE ? OR u.enrollment_number LIKE ?)";
            $searchTerm = "%{$searchFilter}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Count total users
        // Get total count including both registered users and invited users
        $countSql = "
            SELECT COUNT(*) FROM (
                SELECT u.id FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id {$whereClause}
                UNION ALL
                SELECT CONCAT('inv_', i.id) as id FROM invitations i WHERE i.status = 'pending' AND i.expires_at > NOW() AND (i.invited_name LIKE ? OR i.invited_phone LIKE ? OR i.invited_email LIKE ?)
            ) combined_users
        ";
        $countStmt = $db->prepare($countSql);
        
        // Combine params for count query
        $countParams = $params;
        if ($searchFilter) {
            $countParams[] = "%{$searchFilter}%";
            $countParams[] = "%{$searchFilter}%";
            $countParams[] = "%{$searchFilter}%";
        }
        
        $countStmt->execute($countParams);
        $totalUsers = $countStmt->fetchColumn();
        
        // Get users with pagination including both registered users and invited users
        $sql = "
            SELECT * FROM (
                SELECT 
                    u.id,
                    u.email,
                    u.phone_number as phone,
                    u.enrollment_number,
                    u.user_number,
                    u.referred_by_type,
                    u.referred_by_id,
                    u.approval_status,
                    u.profile_completed,
                    u.user_type,
                    u.created_at,
                    u.approved_at,
                    u.approved_by,
                    u.is_active,
                    up.full_name,
                    up.profile_completed as user_profile_completed,
                    latest_sub.subscription_type,
                    latest_sub.subscription_status,
                    latest_sub.subscription_start,
                    latest_sub.subscription_end,
                    CASE 
                        WHEN latest_sub.subscription_status = 'active' AND latest_sub.subscription_end > NOW() THEN 'Premium Member'
                        WHEN latest_sub.subscription_status = 'pending' THEN 'Subscription Pending'
                        ELSE 'Non-Subscriber'
                    END as membership_status,
                    -- Referrer information
                    CASE 
                        WHEN u.referred_by_type = 'admin' THEN admin_ref.username
                        WHEN u.referred_by_type = 'user' THEN user_ref_profile.full_name
                        ELSE NULL
                    END as referred_by_name,
                    CASE 
                        WHEN u.referred_by_type = 'admin' THEN admin_ref.email
                        WHEN u.referred_by_type = 'user' THEN user_ref.email
                        ELSE NULL
                    END as referred_by_email,
                    u.referred_by_type as referrer_type,
                    'registered' as source_type
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id 
                LEFT JOIN admin_users admin_ref ON u.referred_by_type = 'admin' AND u.referred_by_id = admin_ref.id
                LEFT JOIN users user_ref ON u.referred_by_type = 'user' AND u.referred_by_id = user_ref.id
                LEFT JOIN user_profiles user_ref_profile ON user_ref.id = user_ref_profile.user_id
                LEFT JOIN (
                    SELECT s1.user_id, s1.subscription_type, s1.status as subscription_status,
                           s1.start_date as subscription_start, s1.end_date as subscription_end
                    FROM subscriptions s1
                    WHERE s1.id = (
                        SELECT s2.id 
                        FROM subscriptions s2 
                        WHERE s2.user_id = s1.user_id 
                        ORDER BY s2.created_at DESC 
                        LIMIT 1
                    )
                ) latest_sub ON u.id = latest_sub.user_id
                {$whereClause}
                
                UNION ALL
                
                SELECT 
                    CONCAT('inv_', i.id) as id,
                    i.invited_email as email,
                    i.invited_phone as phone,
                    NULL as enrollment_number,
                    NULL as user_number,
                    i.invited_by_type as referred_by_type,
                    i.invited_by_id as referred_by_id,
                    'pending' as approval_status,
                    FALSE as profile_completed,
                    'Invited' as user_type,
                    i.created_at,
                    NULL as approved_at,
                    NULL as approved_by,
                    TRUE as is_active,
                    i.invited_name as full_name,
                    FALSE as user_profile_completed,
                    NULL as subscription_type,
                    NULL as subscription_status,
                    NULL as subscription_start,
                    NULL as subscription_end,
                    'Non-Subscriber' as membership_status,
                    -- Referrer information for invitations
                    CASE 
                        WHEN i.invited_by_type = 'admin' THEN admin_inv_ref.username
                        WHEN i.invited_by_type = 'user' THEN user_inv_ref_profile.full_name
                        ELSE NULL
                    END as referred_by_name,
                    CASE 
                        WHEN i.invited_by_type = 'admin' THEN admin_inv_ref.email
                        WHEN i.invited_by_type = 'user' THEN user_inv_ref.email
                        ELSE NULL
                    END as referred_by_email,
                    i.invited_by_type as referrer_type,
                    'invited' as source_type
                FROM invitations i 
                LEFT JOIN admin_users admin_inv_ref ON i.invited_by_type = 'admin' AND i.invited_by_id = admin_inv_ref.id
                LEFT JOIN users user_inv_ref ON i.invited_by_type = 'user' AND i.invited_by_id = user_inv_ref.id
                LEFT JOIN user_profiles user_inv_ref_profile ON user_inv_ref.id = user_inv_ref_profile.user_id
                WHERE i.status = 'pending' AND i.expires_at > NOW() AND (i.invited_name LIKE ? OR i.invited_phone LIKE ? OR i.invited_email LIKE ?)
            ) combined_users
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ";
        
        $paramsForSelect = $params;
        if ($searchFilter) {
            $paramsForSelect[] = "%{$searchFilter}%";
            $paramsForSelect[] = "%{$searchFilter}%";
            $paramsForSelect[] = "%{$searchFilter}%";
        }
        $paramsForSelect[] = $limit;
        $paramsForSelect[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($paramsForSelect);
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
        
        // Update user status and type
        if ($status === 'approved') {
            // If approving, set user type to 'Approved'
            $sql = "UPDATE users SET approval_status = ?, approved_at = ?, approved_by = ?, user_type = 'Approved' WHERE id = ?";
        } else {
            // For other statuses, don't change user_type
            $sql = "UPDATE users SET approval_status = ?, approved_at = ?, approved_by = ? WHERE id = ?";
        }
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
