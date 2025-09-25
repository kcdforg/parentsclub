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
            // Get account information with comprehensive profile status
            $stmt = $db->prepare("
                SELECT u.*, 
                       up.full_name,
                       up.name,
                       up.intro_completed,
                       up.questions_completed,
                       up.profile_completion_step,
                       up.gender,
                       up.marriageType,
                       up.hasChildren,
                       up.isMarried,
                       up.profile_completed as up_profile_completed,
                       up.date_of_birth,
                       up.email as profile_email,
                       up.secondary_phone,
                       up.address_line1,
                       up.address_line2,
                       up.city,
                       up.district,
                       up.state,
                       up.country,
                       up.pin_code,
                       up.permanent_address_line1,
                       up.permanent_address_line2,
                       up.permanent_city,
                       up.permanent_district,
                       up.permanent_state,
                       up.permanent_country,
                       up.permanent_pin_code,
                       up.same_as_current_address
                FROM users u 
                LEFT JOIN user_profiles up ON u.id = up.user_id 
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
            
            // Format user data for frontend compatibility
            $userData = [
                'id' => $account['id'],
                'email' => $account['profile_email'] ?: $account['email'], // Profile email takes priority
                'phone' => $account['phone'],
                'enrollment_number' => $account['enrollment_number'],
                'user_number' => $account['user_number'],
                'approval_status' => $account['approval_status'],
                'profile_completed' => (bool)($account['up_profile_completed'] ?: $account['profile_completed']),
                'full_name' => $account['name'] ?: ($account['full_name'] ?? ''),
                'referred_by' => $referredByDisplay,
                'intro_completed' => (bool)$account['intro_completed'],
                'questions_completed' => (bool)$account['questions_completed'],
                'profile_completion_step' => $account['profile_completion_step'],
                'created_via_invitation' => (bool)$account['created_via_invitation'],
                'gender' => $account['gender'],
                'marriageType' => $account['marriageType'],
                'hasChildren' => $account['hasChildren'],
                'isMarried' => $account['isMarried'],
                // Add missing profile fields for auto-population
                'date_of_birth' => $account['date_of_birth'],
                'secondary_phone' => $account['secondary_phone'],
                'address_line1' => $account['address_line1'],
                'address_line2' => $account['address_line2'],
                'city' => $account['city'],
                'district' => $account['district'],
                'state' => $account['state'],
                'country' => $account['country'],
                'pin_code' => $account['pin_code'],
                'permanent_address_line1' => $account['permanent_address_line1'],
                'permanent_address_line2' => $account['permanent_address_line2'],
                'permanent_city' => $account['permanent_city'],
                'permanent_district' => $account['permanent_district'],
                'permanent_state' => $account['permanent_state'],
                'permanent_country' => $account['permanent_country'],
                'permanent_pin_code' => $account['permanent_pin_code'],
                'same_as_current_address' => (bool)$account['same_as_current_address']
            ];
            
            echo json_encode([
                'success' => true,
                'user' => $userData,
                'account' => $userData // For backward compatibility
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
