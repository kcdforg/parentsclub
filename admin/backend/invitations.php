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
            $whereConditions[] = "(i.invited_name LIKE ? OR i.invited_email LIKE ?)";
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
        
        if (!isset($input['name']) || !isset($input['email']) || !isset($input['expiry_days'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, email, and expiry days are required']);
            return;
        }
        
        $name = trim($input['name']);
        $email = trim($input['email']);
        $expiryDays = intval($input['expiry_days']);
        
        // Validate input
        if (empty($name) || empty($email) || $expiryDays < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input data']);
            return;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Check if email already has a pending invitation
        $checkSql = "SELECT COUNT(*) FROM invitations WHERE invited_email = ? AND status = 'pending'";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$email]);
        if ($checkStmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'This email already has a pending invitation']);
            return;
        }
        
        // Generate unique invitation code
        $invitationCode = generateUniqueInvitationCode($db);
        
        // Calculate expiry date
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryDays} days"));
        
        // Create invitation
        $sql = "INSERT INTO invitations (invitation_code, invited_name, invited_email, invited_by_type, invited_by_id, expires_at) 
                VALUES (?, ?, ?, 'admin', ?, ?)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $invitationCode,
            $name,
            $email,
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
