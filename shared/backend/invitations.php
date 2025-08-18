<?php
/**
 * Shared Invitation Management API
 * Unified system for both admin and approved user invitation management
 * 
 * Supports:
 * - Admin users (full access)
 * - Approved public users (create/view own invitations)
 * - Premium users (enhanced features if needed)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Main router
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['code'])) {
                validateInvitationCode();
            } else {
                listInvitations();
            }
            break;
        case 'POST':
            if (isset($_POST['action'])) {
                handleInvitationAction();
            } else {
                createInvitation();
            }
            break;
        case 'PUT':
            handleInvitationAction();
            break;
        case 'DELETE':
            deleteInvitation();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Shared Invitation API error: " . $e->getMessage());
}

/**
 * Unified Authorization Check
 * Supports both admin and approved users
 */
function getAuthorizedUser() {
    $sessionToken = getAuthorizationToken();
    if (!$sessionToken) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        exit;
    }

    $sessionManager = SessionManager::getInstance();
    $session = $sessionManager->validateSession($sessionToken);
    
    if (!$session) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired session']);
        exit;
    }

    $db = Database::getInstance()->getConnection();

    if ($session['user_type'] === 'admin') {
        // Admin user - full access
        $stmt = $db->prepare("SELECT id, username, 'admin' as user_type, 'admin' as role FROM admin_users WHERE id = ?");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Admin user not found']);
            exit;
        }
        
        return [
            'id' => $user['id'],
            'type' => 'admin',
            'role' => 'admin',
            'name' => $user['username'],
            'can_create' => true,
            'can_view_all' => true,
            'can_manage_all' => true
        ];
        
    } elseif ($session['user_type'] === 'user') {
        // Public user - check approval status
        $stmt = $db->prepare("
            SELECT u.id, u.approval_status, u.user_type, p.full_name 
            FROM users u 
            LEFT JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$session['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'User not found']);
            exit;
        }

        if ($user['approval_status'] !== 'approved') {
            http_response_code(403);
            echo json_encode([
                'error' => 'Only approved members can access invitation system',
                'approval_status' => $user['approval_status']
            ]);
            exit;
        }

        return [
            'id' => $user['id'],
            'type' => 'user',
            'role' => $user['user_type'], // 'approved', 'premium', etc.
            'name' => $user['full_name'] ?: "User #{$user['id']}",
            'can_create' => true,
            'can_view_all' => false, // Users can only see their own invitations
            'can_manage_all' => false
        ];
    }

    http_response_code(401);
    echo json_encode(['error' => 'Invalid user type']);
    exit;
}

/**
 * List Invitations
 * Admins see all, users see only their own
 */
function listInvitations() {
    $user = getAuthorizedUser();
    $db = Database::getInstance()->getConnection();
    
    // Check and update expired invitations
    checkExpiredInvitations($db);
    
    // Get query parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;
    
    $statusFilter = isset($_GET['status']) ? $_GET['status'] : '';
    $searchFilter = isset($_GET['search']) ? $_GET['search'] : '';
    
    // Build WHERE clause based on user permissions
    $whereConditions = [];
    $params = [];
    
    if (!$user['can_view_all']) {
        // Users can only see their own invitations
        $whereConditions[] = "i.invited_by_type = ? AND i.invited_by_id = ?";
        $params[] = $user['type'];
        $params[] = $user['id'];
    }
    
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
                       WHEN i.invited_by_type = 'user' THEN up.full_name
                       ELSE 'Unknown'
                   END as inviter_name
            FROM invitations i 
            LEFT JOIN admin_users au ON i.invited_by_type = 'admin' AND i.invited_by_id = au.id
            LEFT JOIN users u ON i.invited_by_type = 'user' AND i.invited_by_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
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
        ],
        'user_info' => [
            'type' => $user['type'],
            'role' => $user['role'],
            'name' => $user['name'],
            'can_create' => $user['can_create'],
            'can_view_all' => $user['can_view_all'],
            'can_manage_all' => $user['can_manage_all']
        ]
    ]);
}

/**
 * Create Invitation
 * Both admins and approved users can create
 */
function createInvitation() {
    $user = getAuthorizedUser();
    
    if (!$user['can_create']) {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied to create invitations']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['invited_name']) || !isset($input['invited_phone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and phone are required']);
        return;
    }
    
    $name = trim($input['invited_name']);
    $phone = trim($input['invited_phone']);
    
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
    $inviteCheckSql = "SELECT COUNT(*) FROM invitations WHERE invited_phone = ? AND status = 'pending' AND expires_at > NOW()";
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
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $invitationCode,
        $name,
        $phone,
        $user['type'],
        $user['id'],
        $expiresAt
    ]);
    
    if ($stmt->rowCount() > 0) {
        $invitationId = $db->lastInsertId();
        
        // Generate invitation link
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $invitationLink = $baseUrl . '/regapp2/public/frontend/invitation.html?invitation=' . $invitationCode;
        
        echo json_encode([
            'success' => true,
            'message' => 'Invitation created successfully',
            'invitation_id' => $invitationId,
            'invitation_code' => $invitationCode,
            'invitation_link' => $invitationLink,
            'created_by' => $user['name']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create invitation']);
    }
}

/**
 * Handle Invitation Actions (approve, reject, resend, cancel)
 * Only admins can perform these actions
 */
function handleInvitationAction() {
    $user = getAuthorizedUser();
    
    if (!$user['can_manage_all']) {
        http_response_code(403);
        echo json_encode(['error' => 'Only administrators can manage invitation actions']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    $action = $input['action'] ?? '';
    $invitationId = isset($input['invitation_id']) ? intval($input['invitation_id']) : 0;
    
    if (!$invitationId) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation ID is required']);
        return;
    }
    
    if (!in_array($action, ['approve', 'reject', 'resend', 'cancel'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        return;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Get invitation details
    $invitationSql = "SELECT * FROM invitations WHERE id = ?";
    $invitationStmt = $db->prepare($invitationSql);
    $invitationStmt->execute([$invitationId]);
    $invitation = $invitationStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invitation) {
        http_response_code(404);
        echo json_encode(['error' => 'Invitation not found']);
        return;
    }
    
    switch ($action) {
        case 'approve':
            // For approve, we keep the invitation as 'pending' and reset expiry if needed
            $newExpiresAt = date('Y-m-d H:i:s', strtotime("+3 days"));
            $sql = "UPDATE invitations SET status = 'pending', expires_at = ? WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$newExpiresAt, $invitationId]);
            $message = 'Invitation approved successfully';
            break;
            
        case 'reject':
            // Mark invitation as expired
            $sql = "UPDATE invitations SET status = 'expired' WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$invitationId]);
            $message = 'Invitation rejected successfully';
            break;
            
        case 'resend':
            // Reset expiry date and mark as pending
            $newExpiresAt = date('Y-m-d H:i:s', strtotime("+3 days"));
            $sql = "UPDATE invitations SET expires_at = ?, status = 'pending' WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$newExpiresAt, $invitationId]);
            $message = 'Invitation resent successfully';
            break;
            
        case 'cancel':
            // Mark invitation as expired (cancelled)
            $sql = "UPDATE invitations SET status = 'expired' WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$invitationId]);
            $message = 'Invitation cancelled successfully';
            break;
    }
    
    if ($stmt->rowCount() >= 0) {
        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update invitation']);
    }
}

/**
 * Delete Invitation
 * Admins can delete any, users can delete their own
 */
function deleteInvitation() {
    $user = getAuthorizedUser();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['invitation_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation ID is required']);
        return;
    }
    
    $invitationId = intval($input['invitation_id']);
    
    $db = Database::getInstance()->getConnection();
    
    // Check ownership if not admin
    if (!$user['can_manage_all']) {
        $ownerCheckSql = "SELECT COUNT(*) FROM invitations WHERE id = ? AND invited_by_type = ? AND invited_by_id = ?";
        $ownerCheckStmt = $db->prepare($ownerCheckSql);
        $ownerCheckStmt->execute([$invitationId, $user['type'], $user['id']]);
        
        if ($ownerCheckStmt->fetchColumn() == 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Permission denied to delete this invitation']);
            return;
        }
    }
    
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
}

/**
 * Validate Invitation Code (for registration process)
 * Public endpoint - no authentication required
 */
function validateInvitationCode() {
    $invitationCode = $_GET['code'] ?? '';
    
    if (empty($invitationCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation code is required']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Get invitation details
    $stmt = $db->prepare("
        SELECT i.*, 
               CASE 
                   WHEN i.invited_by_type = 'admin' THEN a.username
                   WHEN i.invited_by_type = 'user' THEN COALESCE(up.full_name, CONCAT('User #', u.user_number))
                   ELSE 'Unknown'
               END as invited_by_display
        FROM invitations i
        LEFT JOIN admin_users a ON i.invited_by_type = 'admin' AND i.invited_by_id = a.id
        LEFT JOIN users u ON i.invited_by_type = 'user' AND i.invited_by_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE i.invitation_code = ?
    ");
    $stmt->execute([$invitationCode]);
    $invitation = $stmt->fetch();
    
    if (!$invitation) {
        http_response_code(404);
        echo json_encode(['error' => 'Invitation not found']);
        exit;
    }
    
    // Check if invitation is still valid (status 'pending' and not expired)
    if ($invitation['status'] !== 'pending') {
        $errorMessage = 'Invitation has already been used, expired, or is not available.';
        if ($invitation['status'] === 'used') {
            $errorMessage = 'This invitation has already been used to register an account. Please log in.';
        } elseif ($invitation['status'] === 'expired') {
            $errorMessage = 'This invitation has expired. Please request a new invitation.';
        }
        echo json_encode([
            'success' => false,
            'error' => $errorMessage,
            'invitation' => [
                'status' => $invitation['status'],
                'invited_name' => $invitation['invited_name'],
                'invited_phone' => $invitation['invited_phone']
            ]
        ]);
        exit;
    }
    
    // Check if invitation has expired based on expires_at timestamp
    $expiresAtTimestamp = strtotime($invitation['expires_at']);
    if (time() > $expiresAtTimestamp) {
        // Mark invitation as expired if it's pending but past its expires_at
        $stmt = $db->prepare("UPDATE invitations SET status = 'expired' WHERE id = ?");
        $stmt->execute([$invitation['id']]);
        
        echo json_encode([
            'success' => false,
            'error' => 'This invitation has expired. Please request a new invitation.',
            'invitation' => [
                'status' => 'expired',
                'invited_name' => $invitation['invited_name'],
                'invited_phone' => $invitation['invited_phone'],
                'expires_at' => $invitation['expires_at']
            ]
        ]);
        exit;
    }
    
    // Validate that the invitation has required data
    if (empty($invitation['invited_name']) || empty($invitation['invited_phone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid invitation data']);
        exit;
    }
    
    // Return valid invitation details
    echo json_encode([
        'success' => true,
        'invitation' => [
            'invitation_code' => $invitation['invitation_code'],
            'invited_name' => $invitation['invited_name'],
            'invited_phone' => $invitation['invited_phone'],
            'invited_by_type' => $invitation['invited_by_type'],
            'invited_by_display' => $invitation['invited_by_display'],
            'expires_at' => $invitation['expires_at'],
            'status' => $invitation['status']
        ]
    ]);
}

/**
 * Helper Functions
 */
function generateUniqueInvitationCode($db) {
    do {
        $code = bin2hex(random_bytes(32));
        $stmt = $db->prepare("SELECT COUNT(*) FROM invitations WHERE invitation_code = ?");
        $stmt->execute([$code]);
    } while ($stmt->fetchColumn() > 0);
    
    return $code;
}

function checkExpiredInvitations($db) {
    try {
        // Find invitations that are past their expiry
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
