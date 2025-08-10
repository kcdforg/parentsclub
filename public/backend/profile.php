<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
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
            // Get user profile
            $stmt = $db->prepare("
                SELECT u.*, p.* 
                FROM users u 
                LEFT JOIN user_profiles p ON u.id = p.user_id 
                WHERE u.id = ?
            ");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch();
            
            if (!$profile) {
                http_response_code(404);
                echo json_encode(['error' => 'Profile not found']);
                exit;
            }
            
            // Get referred by information
            $referredByDisplay = 'Direct';
            if ($profile['referred_by_type'] === 'admin') {
                $stmt = $db->prepare("SELECT username FROM admin_users WHERE id = ?");
                $stmt->execute([$profile['referred_by_id']]);
                $admin = $stmt->fetch();
                $referredByDisplay = 'Admin: ' . ($admin['username'] ?? 'Unknown');
            } elseif ($profile['referred_by_type'] === 'user') {
                $stmt = $db->prepare("SELECT user_number FROM users WHERE id = ?");
                $stmt->execute([$profile['referred_by_id']]);
                $referrer = $stmt->fetch();
                $referredByDisplay = 'User: ' . ($referrer['user_number'] ?? 'Unknown');
            }
            
            unset($profile['password']); // Remove password from response
            $profile['referred_by_display'] = $referredByDisplay;
            
            echo json_encode([
                'success' => true,
                'profile' => $profile
            ]);
            break;
            
        case 'POST':
        case 'PUT':
            // Create or update profile
            $input = json_decode(file_get_contents('php://input'), true);
            
            $requiredFields = ['full_name', 'date_of_birth', 'address', 'pin_code', 'phone'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty(trim($input[$field]))) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '{$field}' is required"]);
                    exit;
                }
            }
            
            $fullName = trim($input['full_name']);
            $dateOfBirth = $input['date_of_birth'];
            $address = trim($input['address']);
            $pinCode = trim($input['pin_code']);
            $phone = trim($input['phone']);
            
            // Validate data
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }
            
            if (!preg_match('/^\d{6}$/', $pinCode)) {
                http_response_code(400);
                echo json_encode(['error' => 'PIN code must be 6 digits']);
                exit;
            }
            
            if (!preg_match('/^\+?[\d\s\-\(\)]+$/', $phone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid phone number format']);
                exit;
            }
            
            // Validate age (must be at least 18)
            $dobDate = new DateTime($dateOfBirth);
            $today = new DateTime();
            $age = $today->diff($dobDate)->y;
            
            if ($age < 18) {
                http_response_code(400);
                echo json_encode(['error' => 'You must be at least 18 years old']);
                exit;
            }
            
            // Check if profile already exists
            $stmt = $db->prepare("SELECT id FROM user_profiles WHERE user_id = ?");
            $stmt->execute([$user['id']]);
            $existingProfile = $stmt->fetch();
            
            if ($existingProfile) {
                // Update existing profile
                $stmt = $db->prepare("
                    UPDATE user_profiles 
                    SET full_name = ?, date_of_birth = ?, address = ?, pin_code = ?, phone = ?, 
                        profile_completed = 1, updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([$fullName, $dateOfBirth, $address, $pinCode, $phone, $user['id']]);
                $message = 'Profile updated successfully';
            } else {
                // Create new profile
                $stmt = $db->prepare("
                    INSERT INTO user_profiles (user_id, full_name, date_of_birth, address, pin_code, phone, profile_completed)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                ");
                $stmt->execute([$user['id'], $fullName, $dateOfBirth, $address, $pinCode, $phone]);
                $message = 'Profile created successfully';
            }
            
            echo json_encode([
                'success' => true,
                'message' => $message
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Profile API error: " . $e->getMessage());
}
?>
