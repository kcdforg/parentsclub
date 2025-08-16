<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Authenticate user
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$user = $sessionManager->getUserFromSession($sessionToken);

if (!$user || $user['user_type'] !== 'user') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

// Check if user is approved
if ($user['approval_status'] !== 'approved') {
    http_response_code(403);
    echo json_encode(['error' => 'Account not approved yet']);
    exit;
}

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get user's referrals
            $stmt = $db->prepare("
                SELECT i.*, u.email as used_by_email, u.approval_status as referred_user_status,
                       u.user_number as referred_user_number
                FROM invitations i
                LEFT JOIN users u ON i.used_by = u.id
                WHERE i.invited_by_type = 'user' AND i.invited_by_id = ?
                ORDER BY i.created_at DESC
            ");
            $stmt->execute([$user['id']]);
            $referrals = $stmt->fetchAll();
            
            // Add invitation links
            $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
            foreach ($referrals as &$referral) {
                $referral['invitation_link'] = $baseUrl . '/public/frontend/invitation.html?invitation=' . $referral['invitation_code'];
            }
            
            // Get referral statistics
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_invitations,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invitations,
                    SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_invitations,
                    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_invitations
                FROM invitations 
                WHERE invited_by_type = 'user' AND invited_by_id = ?
            ");
            $stmt->execute([$user['id']]);
            $stats = $stmt->fetch();
            
            // Get approved referrals count
            $stmt = $db->prepare("
                SELECT COUNT(*) as approved_referrals
                FROM invitations i
                JOIN users u ON i.used_by = u.id
                WHERE i.invited_by_type = 'user' AND i.invited_by_id = ? AND u.approval_status = 'approved'
            ");
            $stmt->execute([$user['id']]);
            $approvedReferrals = $stmt->fetch()['approved_referrals'];
            
            echo json_encode([
                'success' => true,
                'referrals' => $referrals,
                'stats' => [
                    'total_invitations' => (int)$stats['total_invitations'],
                    'pending_invitations' => (int)$stats['pending_invitations'],
                    'used_invitations' => (int)$stats['used_invitations'],
                    'expired_invitations' => (int)$stats['expired_invitations'],
                    'approved_referrals' => (int)$approvedReferrals
                ],
                'user_number' => $user['user_number']
            ]);
            break;
            
        case 'POST':
            // Create referral invitation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and email are required']);
                exit;
            }
            
            $name = trim($input['name']);
            $email = trim(strtolower($input['email']));
            
            if (empty($name) || empty($email)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and email cannot be empty']);
                exit;
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }
            
            // Check if user already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'User with this email already exists']);
                exit;
            }
            
            // Check if there's already a pending invitation for this email
            $stmt = $db->prepare("
                SELECT id FROM invitations 
                WHERE invited_email = ? AND status = 'pending' AND expires_at > NOW()
            ");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Pending invitation already exists for this email']);
                exit;
            }
            
            // Check if user is trying to refer themselves
            if ($email === $user['email']) {
                http_response_code(400);
                echo json_encode(['error' => 'You cannot refer yourself']);
                exit;
            }
            
            // Generate invitation code
            $invitationCode = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60)); // 30 days
            
            $stmt = $db->prepare("
                INSERT INTO invitations (invitation_code, invited_name, invited_email, invited_by_type, invited_by_id, expires_at)
                VALUES (?, ?, ?, 'user', ?, ?)
            ");
            $stmt->execute([$invitationCode, $name, $email, $user['id'], $expiresAt]);
            
            // Create invitation link
            $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
            $invitationLink = $baseUrl . '/regapp2/public/frontend/invitation.html?invitation=' . $invitationCode;
            
            echo json_encode([
                'success' => true,
                'message' => 'Referral invitation created successfully',
                'invitation_code' => $invitationCode,
                'invitation_link' => $invitationLink,
                'expires_at' => $expiresAt,
                'invited_name' => $name,
                'invited_email' => $email
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Referral API error: " . $e->getMessage());
}
?>
