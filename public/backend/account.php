<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT');
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

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get account information
            $stmt = $db->prepare("
                SELECT u.*, p.full_name, p.profile_completed, u.user_type
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.id = ?
            ");
            $stmt->execute([$user['id']]);
            $account = $stmt->fetch();
            
            if (!$account) {
                http_response_code(404);
                echo json_encode(['error' => 'Account not found']);
                exit;
            }
            
            // Get referred by information
            $referredByDisplay = 'Direct';
            if ($account['referred_by_type'] === 'admin') {
                $stmt = $db->prepare("SELECT username FROM admin_users WHERE id = ?");
                $stmt->execute([$account['referred_by_id']]);
                $admin = $stmt->fetch();
                $referredByDisplay = 'Admin: ' . ($admin['username'] ?? 'Unknown');
            } elseif ($account['referred_by_type'] === 'user') {
                $stmt = $db->prepare("SELECT user_number FROM users WHERE id = ?");
                $stmt->execute([$account['referred_by_id']]);
                $referrer = $stmt->fetch();
                $referredByDisplay = 'User: ' . ($referrer['user_number'] ?? 'Unknown');
            }
            
            unset($account['password']); // Remove password from response
            $account['referred_by_display'] = $referredByDisplay;
            
            echo json_encode([
                'success' => true,
                'account' => $account
            ]);
            break;
            
        case 'PUT':
            // Update account (change password)
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? null;
            
            if ($action === 'change_password') {
                $currentPassword = $input['current_password'] ?? '';
                $newPassword = $input['new_password'] ?? '';
                
                if (empty($currentPassword) || empty($newPassword)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Current password and new password are required']);
                    exit;
                }
                
                if (strlen($newPassword) < 6) {
                    http_response_code(400);
                    echo json_encode(['error' => 'New password must be at least 6 characters']);
                    exit;
                }
                
                // Verify current password
                $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$user['id']]);
                $currentUser = $stmt->fetch();
                
                if (!$currentUser || !password_verify($currentPassword, $currentUser['password'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Current password is incorrect']);
                    exit;
                }
                
                // Update password
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$hashedPassword, $user['id']]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Password updated successfully'
                ]);
                
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Account API error: " . $e->getMessage());
}
?>
