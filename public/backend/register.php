<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';
require_once '../../config/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password']) || !isset($input['full_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email, password, and full name are required']);
        exit;
    }
    
    $fullName = trim($input['full_name']);
    $email = trim(strtolower($input['email']));
    $password = $input['password'];
    $invitationCode = $input['invitation_code'] ?? null;
    
    // Validate input
    if (empty($fullName) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Full name, email and password cannot be empty']);
        exit;
    }
    
    if (strlen($fullName) < 2) {
        http_response_code(400);
        echo json_encode(['error' => 'Full name must be at least 2 characters']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }
    
    // Require invitation code for registration
    if (empty($invitationCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation code is required for registration']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if email already exists in users table
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }
    
    // Check if email already exists in admin_users table
    $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already exists as an admin user']);
        exit;
    }
    
    $referredByType = null;
    $referredById = null;
    
    // Validate invitation code
    $stmt = $db->prepare("
        SELECT * FROM invitations 
        WHERE invitation_code = ? AND status = 'pending' AND expires_at > NOW()
    ");
    $stmt->execute([$invitationCode]);
    $invitation = $stmt->fetch();
    
    if (!$invitation) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired invitation code']);
        exit;
    }
    
    // Verify email or phone matches invitation
    $invitationMatches = false;
    
    if ($invitation['invitation_type'] === 'email') {
        if (strtolower($invitation['invited_email']) === $email) {
            $invitationMatches = true;
        }
    } elseif ($invitation['invitation_type'] === 'phone') {
        if ($invitation['invited_phone'] === $email) { // Note: $email variable is used for both email and phone in registration
            $invitationMatches = true;
        }
    }
    
    if (!$invitationMatches) {
        http_response_code(400);
        echo json_encode(['error' => 'Email/Phone does not match invitation']);
        exit;
    }
    
    $referredByType = $invitation['invited_by_type'];
    $referredById = $invitation['invited_by_id'];
    
    // Generate enrollment number
    $stmt = $db->query("SELECT COALESCE(MAX(CAST(SUBSTRING(enrollment_number, 4) AS UNSIGNED)), 0) + 1 as next_number FROM users WHERE enrollment_number LIKE 'ENR%'");
    $nextNumber = $stmt->fetch()['next_number'];
    $enrollmentNumber = 'ENR' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    
    // Generate user number
    $stmt = $db->query("SELECT COALESCE(MAX(user_number), 0) + 1 as next_user_number FROM users");
    $nextUserNumber = $stmt->fetch()['next_user_number'];
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $db->beginTransaction();
    
    try {
        // Create user (set type as 'Registered')
        $stmt = $db->prepare("
            INSERT INTO users (email, password, enrollment_number, user_number, referred_by_type, referred_by_id, approval_status, user_type) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 'Registered')
        ");
        $stmt->execute([$email, $hashedPassword, $enrollmentNumber, $nextUserNumber, $referredByType, $referredById]);
        $userId = $db->lastInsertId();
        
        // Create partial profile with name
        $stmt = $db->prepare("
            INSERT INTO user_profiles (user_id, full_name, date_of_birth, address, pin_code, phone, profile_completed) 
            VALUES (?, ?, '1900-01-01', '', '', '', FALSE)
        ");
        $stmt->execute([$userId, $fullName]);
        
        // Mark invitation as used
        $stmt = $db->prepare("
            UPDATE invitations 
            SET status = 'used', used_at = NOW(), used_by = ? 
            WHERE id = ?
        ");
        $stmt->execute([$userId, $invitation['id']]);
        
        // Implement cross-invite expiration logic
        // If user registered with email invite and has a phone, expire any pending phone invites for that phone
        // If user registered with phone invite and provides email, expire any pending email invites for that email
        
        if ($invitation['invitation_type'] === 'email' && !empty($invitation['invited_phone'])) {
            // User registered via email invite, expire any pending phone invites for same phone
            $stmt = $db->prepare("
                UPDATE invitations 
                SET status = 'expired' 
                WHERE invited_phone = ? AND status = 'pending' AND expires_at > NOW() AND id != ?
            ");
            $stmt->execute([$invitation['invited_phone'], $invitation['id']]);
            
        } elseif ($invitation['invitation_type'] === 'phone' && !empty($invitation['invited_email'])) {
            // User registered via phone invite, expire any pending email invites for same email
            $stmt = $db->prepare("
                UPDATE invitations 
                SET status = 'expired' 
                WHERE invited_email = ? AND status = 'pending' AND expires_at > NOW() AND id != ?
            ");
            $stmt->execute([$invitation['invited_email'], $invitation['id']]);
        }
        
        // Additional cross-expiration: when user completes registration, if they later add
        // phone/email during profile completion, we'll handle that in profile.php
        
        $db->commit();
        
        // Create session for the new user
        $sessionManager = SessionManager::getInstance();
        $sessionId = $sessionManager->createSession('user', $userId, [
            'email' => $email,
            'enrollment_number' => $enrollmentNumber,
            'full_name' => $fullName
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'session_token' => $sessionId,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'enrollment_number' => $enrollmentNumber,
                'user_number' => $nextUserNumber,
                'full_name' => $fullName,
                'approval_status' => 'pending',
                'profile_completed' => false
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
    error_log("Registration error: " . $e->getMessage());
}
?>
