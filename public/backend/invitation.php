<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php'; // Include SessionManager

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Existing GET logic remains largely the same, just move auth check to top if not already there
            $invitationCode = $_GET['code'] ?? '';
            
            if (empty($invitationCode)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invitation code is required']);
                exit;
            }
            
            // Get invitation details
            $stmt = $db->prepare("
                SELECT i.*, 
                       CASE 
                           WHEN i.invited_by_type = 'admin' THEN a.username
                           ELSE CONCAT('User #', u.user_number)
                       END as invited_by_display
                FROM invitations i
                LEFT JOIN admin_users a ON i.invited_by_type = 'admin' AND i.invited_by_id = a.id
                LEFT JOIN users u ON i.invited_by_type = 'user' AND i.invited_by_id = u.id
                WHERE i.invitation_code = ?
            ");
            $stmt->execute([$invitationCode]);
            $invitation = $stmt->fetch();
            
            if (!$invitation) {
                http_response_code(404);
                echo json_encode(['error' => 'Invitation not found']);
                exit;
            }
            
            // Check if invitation is still valid
            if ($invitation['status'] !== 'pending') {
                echo json_encode([
                    'success' => false,
                    'error' => 'Invitation has already been used or expired',
                    'invitation' => [
                        'status' => $invitation['status'],
                        'invited_name' => $invitation['invited_name'],
                        'invited_email' => $invitation['invited_email'],
                        'invited_phone' => $invitation['invited_phone']
                    ]
                ]);
                exit;
            }
            
            // Check if invitation has expired (72 hours from creation)
            $invitationAge = time() - strtotime($invitation['created_at']);
            $maxAge = 72 * 3600; // 72 hours in seconds
            
            if ($invitationAge > $maxAge) {
                // Mark invitation as expired
                $stmt = $db->prepare("UPDATE invitations SET status = 'expired' WHERE id = ?");
                $stmt->execute([$invitation['id']]);
                
                echo json_encode([
                    'success' => false,
                    'error' => 'Invitation has expired after 72 hours. Please request a new invitation.',
                    'invitation' => [
                        'status' => 'expired',
                        'invited_name' => $invitation['invited_name'],
                        'invited_email' => $invitation['invited_email'],
                        'invited_phone' => $invitation['invited_phone'],
                        'created_at' => $invitation['created_at']
                    ]
                ]);
                exit;
            }
            
            // Validate that the invitation has required data (either email or phone)
            if (empty($invitation['invited_name']) || (empty($invitation['invited_email']) && empty($invitation['invited_phone']))) {
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
                    'invited_email' => $invitation['invited_email'],
                    'invited_phone' => $invitation['invited_phone'],
                    'invited_by_type' => $invitation['invited_by_type'],
                    'invited_by_display' => $invitation['invited_by_display'],
                    'expires_at' => $invitation['expires_at'],
                    'status' => $invitation['status']
                ]
            ]);
            break;
            
        case 'POST':
            // Authenticate admin user for POST requests
            $headers = function_exists('getallheaders') ? getallheaders() : [];
            $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            
            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Authorization token required']);
                exit;
            }
            
            $adminSessionToken = $matches[1];
            $sessionManager = SessionManager::getInstance();
            $admin = $sessionManager->getAdminUserFromSession($adminSessionToken);
            
            if (!$admin) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired admin session']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $invited_name = trim($input['invited_name'] ?? '');
            $invited_email = trim($input['invited_email'] ?? '');
            $invited_phone = trim($input['invited_phone'] ?? '');
            
            if (empty($invited_name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invited name is required.']);
                exit;
            }
            
            if (empty($invited_email) && empty($invited_phone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Either invited email or phone number is required.']);
                exit;
            }
            
            // Basic email validation
            if (!empty($invited_email) && !filter_var($invited_email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid invited email format.']);
                exit;
            }
            
            // Basic phone validation (matches frontend regex for +countrycodeNUMBER)
            if (!empty($invited_phone) && !preg_match('/^\+\d{1,4}\d{7,15}$/', $invited_phone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid invited phone number format. Must include country code (e.g., +1234567890).']);
                exit;
            }
            
            // Generate unique invitation code
            $invitationCode = bin2hex(random_bytes(16)); // 32 char hex string
            
            $stmt = $db->prepare("
                INSERT INTO invitations (
                    invitation_code, invited_name, invited_email, invited_phone, 
                    invited_by_type, invited_by_id, status
                ) VALUES (?, ?, ?, ?, 'admin', ?, 'pending')
            ");
            $stmt->execute([
                $invitationCode, $invited_name, $invited_email, $invited_phone, 
                $admin['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Invitation created successfully',
                'invitation_code' => $invitationCode
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
    error_log("Invitation API error: " . $e->getMessage());
}
?>
