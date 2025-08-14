<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    listInvitations();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    createInvitation();
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    deleteInvitation();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function listInvitations() {
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
        
        // Check and update expired invitations
        checkExpiredInvitations($db);
        
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
            $whereConditions[] = "i.status = ?";
            $params[] = $statusFilter;
        }
        
        if ($searchFilter) {
            $whereConditions[] = "(i.invited_name LIKE ? OR i.invited_phone LIKE ?)";
            $searchTerm = "%{$searchFilter}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Count total invitations
        $countSql = "SELECT COUNT(*) FROM invitations i {$whereClause}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $totalInvitations = $countStmt->fetchColumn();
        
        // Get invitations with pagination
        $sql = "SELECT i.*, 
                       CASE 
                           WHEN i.invited_by_type = 'admin' THEN au.username
                           WHEN i.invited_by_type = 'user' THEN u.email
                           ELSE 'Unknown'
                       END as inviter_name
                FROM invitations i 
                LEFT JOIN admin_users au ON i.invited_by_type = 'admin' AND i.invited_by_id = au.id
                LEFT JOIN users u ON i.invited_by_type = 'user' AND i.invited_by_id = u.id
                {$whereClause}
                ORDER BY i.created_at DESC 
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate pagination info
        $totalPages = ceil($totalInvitations / $limit);
        $start = $offset + 1;
        $end = min($offset + $limit, $totalInvitations);
        
        echo json_encode([
            'success' => true,
            'invitations' => $invitations,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total' => $totalInvitations,
                'start' => $start,
                'end' => $end,
                'limit' => $limit
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
        error_log("Error listing invitations: " . $e->getMessage());
    }
}

function createInvitation() {
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
        
        if (!isset($input['name']) || !isset($input['phone'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and phone are required']);
            return;
        }
        
        $name = trim($input['name']);
        $phone = trim($input['phone']);
        
        // Validate input
        if (empty($name) || empty($phone)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input data']);
            return;
        }
        
        // Validate phone number format (country code + 7-15 digits)
        if (!preg_match('/^\+\d{1,4}\d{7,15}$/', $phone)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid phone number format. Must include country code and be 7-15 digits.']);
            return;
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Check if phone already exists as a registered user
        $userCheckSql = "SELECT COUNT(*) FROM users WHERE phone = ?";
        $userCheckStmt = $db->prepare($userCheckSql);
        $userCheckStmt->execute([$phone]);
        if ($userCheckStmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'This phone number is already registered as a user']);
            return;
        }
        
        // Check if phone already exists in user profiles
        $profileCheckSql = "SELECT COUNT(*) FROM user_profiles WHERE phone = ?";
        $profileCheckStmt = $db->prepare($profileCheckSql);
        $profileCheckStmt->execute([$phone]);
        if ($profileCheckStmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'This phone number is already registered in a user profile']);
            return;
        }
        
        // Check if phone already has a pending invitation
        $inviteCheckSql = "SELECT COUNT(*) FROM invitations WHERE invited_phone = ? AND status = 'pending'";
        $inviteCheckStmt = $db->prepare($inviteCheckSql);
        $inviteCheckStmt->execute([$phone]);
        if ($inviteCheckStmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'This phone number already has a pending invitation']);
            return;
        }
        
        // Generate unique invitation code
        $invitationCode = generateUniqueInvitationCode($db);
        
        // Calculate expiry date (72 hours from now)
        $expiresAt = date('Y-m-d H:i:s', strtotime("+3 days"));
        
        // Create invitation
        $sql = "INSERT INTO invitations (invitation_code, invited_name, invited_phone, invited_by_type, invited_by_id, expires_at) 
                VALUES (?, ?, ?, 'admin', ?, ?)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $invitationCode,
            $name,
            $phone,
            $session['user_id'],
            $expiresAt
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Invitation created successfully',
                'invitation_code' => $invitationCode
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create invitation']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
        error_log("Error creating invitation: " . $e->getMessage());
    }
}

function deleteInvitation() {
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
        
        if (!isset($input['invitation_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invitation ID is required']);
            return;
        }
        
        $invitationId = intval($input['invitation_id']);
        
        $db = Database::getInstance()->getConnection();
        
        // Delete invitation
        $sql = "DELETE FROM invitations WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$invitationId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Invitation deleted successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invitation not found']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
        error_log("Error deleting invitation: " . $e->getMessage());
    }
}

function generateUniqueInvitationCode($db) {
    do {
        $code = bin2hex(random_bytes(32));
        $stmt = $db->prepare("SELECT COUNT(*) FROM invitations WHERE invitation_code = ?");
        $stmt->execute([$code]);
    } while ($stmt->fetchColumn() > 0);
    
    return $code;
}

// Function to check and update expired invitations
function checkExpiredInvitations($db) {
    try {
        // Find invitations that are past their 72-hour expiry
        $sql = "UPDATE invitations SET status = 'expired' 
                WHERE status = 'pending' 
                AND expires_at < NOW()";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        
        return $stmt->rowCount();
    } catch (Exception $e) {
        error_log("Error checking expired invitations: " . $e->getMessage());
        return 0;
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
