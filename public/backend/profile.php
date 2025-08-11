<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Authenticate user
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

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
            
            // Check if DOB is today's date (prevent default submission)
            $today = date('Y-m-d');
            if ($dateOfBirth === $today) {
                http_response_code(400);
                echo json_encode(['error' => 'Please enter your actual date of birth, not today\'s date']);
                exit;
            }
            
            // Validate age (must be 18 or older)
            $dobTimestamp = strtotime($dateOfBirth);
            $todayTimestamp = strtotime($today);
            $ageInSeconds = $todayTimestamp - $dobTimestamp;
            $ageInYears = floor($ageInSeconds / (365.25 * 24 * 3600)); // Account for leap years
            
            if ($ageInYears < 18) {
                http_response_code(400);
                echo json_encode(['error' => 'You must be at least 18 years old to complete your profile']);
                exit;
            }
            
            if (!preg_match('/^\d{6}$/', $pinCode)) {
                http_response_code(400);
                echo json_encode(['error' => 'PIN code must be 6 digits']);
                exit;
            }
            
            // Enhanced phone validation
            if (!preg_match('/^\+\d{1,4}\d{7,15}$/', $phone)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid phone number format. Must include country code and be 7-15 digits.']);
                exit;
            }
            
            // Validate specific country formats
            if (preg_match('/^\+91(\d{10})$/', $phone, $matches)) {
                // Indian number: must start with 6-9
                if (!preg_match('/^[6-9]/', $matches[1])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Indian mobile number must start with 6, 7, 8, or 9']);
                    exit;
                }
            } elseif (preg_match('/^\+1(\d+)$/', $phone, $matches)) {
                // US/Canada: must be exactly 10 digits
                if (strlen($matches[1]) !== 10) {
                    http_response_code(400);
                    echo json_encode(['error' => 'US/Canada phone number must be exactly 10 digits']);
                    exit;
                }
            } elseif (preg_match('/^\+44(\d+)$/', $phone, $matches)) {
                // UK: must be exactly 10 digits
                if (strlen($matches[1]) !== 10) {
                    http_response_code(400);
                    echo json_encode(['error' => 'UK phone number must be exactly 10 digits']);
                    exit;
                }
            } elseif (preg_match('/^\+61(\d+)$/', $phone, $matches)) {
                // Australia: must be exactly 9 digits
                if (strlen($matches[1]) !== 9) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Australian phone number must be exactly 9 digits']);
                    exit;
                }
            } elseif (preg_match('/^\+81(\d+)$/', $phone, $matches)) {
                // Japan: must be 10-11 digits
                $length = strlen($matches[1]);
                if ($length < 10 || $length > 11) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Japanese phone number must be 10-11 digits']);
                    exit;
                }
            }
            
            // Validate age (must be at least 18)
            try {
                $dobDate = new DateTime($dateOfBirth);
                $today = new DateTime();
                $age = $today->diff($dobDate)->y;
                
                if ($age < 18) {
                    http_response_code(400);
                    echo json_encode(['error' => 'You must be at least 18 years old']);
                    exit;
                }
                
                // Check if date is not in the future
                if ($dobDate > $today) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Date of birth cannot be in the future']);
                    exit;
                }
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date format']);
                exit;
            }
            
            // Check for duplicate phone numbers (exclude current user)
            $stmt = $db->prepare("SELECT up.user_id, u.email FROM user_profiles up JOIN users u ON up.user_id = u.id WHERE up.phone = ? AND up.user_id != ?");
            $stmt->execute([$phone, $user['id']]);
            $existingPhone = $stmt->fetch();
            
            if ($existingPhone) {
                http_response_code(400);
                echo json_encode(['error' => 'This phone number is already registered by another user']);
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
            
            // Update user table to mark profile as completed and set type as 'Enrolled'
            $stmt = $db->prepare("UPDATE users SET profile_completed = 1, user_type = 'Enrolled' WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Cross-invite expiration logic: when user adds phone number during profile completion,
            // expire any pending phone invitations for this phone number that weren't used by this user
            $stmt = $db->prepare("
                UPDATE invitations 
                SET status = 'expired' 
                WHERE invited_phone = ? AND status = 'pending' AND expires_at > NOW() AND used_by != ?
            ");
            $stmt->execute([$phone, $user['id']]);
            
            // Also expire any pending email invitations for this user's email that weren't used by this user
            $stmt = $db->prepare("
                UPDATE invitations 
                SET status = 'expired' 
                WHERE invited_email = ? AND status = 'pending' AND expires_at > NOW() AND used_by != ?
            ");
            $stmt->execute([$user['email'], $user['id']]);
            
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
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
    error_log("Profile API error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
}
?>
