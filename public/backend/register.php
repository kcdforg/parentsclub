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
    
    if (!$input || !isset($input['password']) || !isset($input['invitation_code'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Password and invitation code are required']);
        exit;
    }
    
    $password = $input['password'];
    $invitationCode = $input['invitation_code'];
    
    // No longer expecting full_name, email, or phone directly from registration form
    // These will come from the invitation itself.
    
    // Validate input
    if (empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password cannot be empty']);
        exit;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }
    
    // Require invitation code for registration (already checked above, but keep validation concise)
    if (empty($invitationCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation code is required for registration']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Validate invitation code and retrieve invitation details
    $stmt = $db->prepare("
        SELECT * FROM invitations 
        WHERE invitation_code = ? AND status = 'pending'
    ");
    $stmt->execute([$invitationCode]);
    $invitation = $stmt->fetch();
    
    if (!$invitation) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired invitation code']);
        exit;
    }
    
    // Check if invitation has expired (72 hours from creation)
    $invitationAge = time() - strtotime($invitation['created_at']);
    $maxAge = 72 * 3600; // 72 hours in seconds
    
    if ($invitationAge > $maxAge) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation has expired after 72 hours. Please request a new invitation.']);
        exit;
    }
    
    // Get invited email, phone, and name from the validated invitation
    $invitedEmail = $invitation['invited_email'] ?? null;
    $invitedPhone = $invitation['invited_phone'] ?? null;
    $invitedName = $invitation['invited_name'] ?? 'New User'; // Default name if not provided in invite
    
    // Ensure either invited email or phone is available in the invitation
    if (empty($invitedEmail) && empty($invitedPhone)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation is missing required contact information (email or phone)']);
        exit;
    }
    
    // Check for duplicate email/phone using data from invitation
    // Check if email already exists in users table
    if (!empty($invitedEmail)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$invitedEmail]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'The email address from this invitation is already registered.']);
            exit;
        }
        
        // Check if email already exists in admin_users table
        $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
        $stmt->execute([$invitedEmail]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'The email address from this invitation exists as an admin user.']);
            exit;
        }
    }
    
    // Check if phone already exists in users table
    if (!empty($invitedPhone)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$invitedPhone]);
        if ($stmt->fetch()) {
        http_response_code(400);
            echo json_encode(['error' => 'The phone number from this invitation is already registered.']);
        exit;
    }
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
    
    // Log number generation for debugging
    error_log("Number generation - Enrollment: $enrollmentNumber, User: $nextUserNumber");
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $db->beginTransaction();
    
    try {
        // Create user with user_type as 'registered' (has password through invite)
        $stmt = $db->prepare("
            INSERT INTO users (email, phone, password, enrollment_number, user_number, referred_by_type, referred_by_id, approval_status, user_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'registered')
        ");
        $stmt->execute([$invitedEmail, $invitedPhone, $hashedPassword, $enrollmentNumber, $nextUserNumber, $referredByType, $referredById]);
        $userId = $db->lastInsertId();
        
        // Log user creation for debugging
        error_log("User created - ID: $userId, Email: $invitedEmail, Phone: $invitedPhone, Enrollment: $enrollmentNumber");
        
        // Create partial profile with invited name. Other fields are empty/default.
        $stmt = $db->prepare("
            INSERT INTO user_profiles (user_id, full_name, date_of_birth, address, pin_code, phone, profile_completed) 
            VALUES (?, ?, '1900-01-01', '', '', '', FALSE)
        ");
        $stmt->execute([$userId, $invitedName]);
        
        // Log profile creation for debugging
        error_log("User profile created - User ID: $userId, Name: $invitedName");
        
        // Mark invitation as used
        $stmt = $db->prepare("
            UPDATE invitations 
            SET status = 'used', used_at = NOW(), used_by = ? 
            WHERE id = ?
        ");
        $stmt->execute([$userId, $invitation['id']]);
        
        // Log invitation update for debugging
        error_log("Invitation marked as used - Invitation ID: {$invitation['id']}, Used by: $userId");
        
        $db->commit();
        
        // Log successful transaction for debugging
        error_log("Database transaction committed successfully for user: $userId");
        
        // Create session for the new user
        try {
            $sessionManager = SessionManager::getInstance();
            $sessionId = $sessionManager->createSession('user', $userId, [
                'email' => $invitedEmail,
                'enrollment_number' => $enrollmentNumber,
                'full_name' => $invitedName
            ]);
        } catch (Exception $sessionError) {
            error_log("Session creation error: " . $sessionError->getMessage());
            // Continue with registration even if session creation fails
            $sessionId = null;
        }
        
        $response = [
            'success' => true,
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'email' => $invitedEmail,
                'phone' => $invitedPhone,
                'enrollment_number' => $enrollmentNumber,
                'user_number' => $nextUserNumber,
                'full_name' => $invitedName,
                'approval_status' => 'pending',
                'user_type' => 'registered',
                'profile_completed' => false
            ]
        ];
        
        if ($sessionId) {
            $response['session_token'] = $sessionId;
        }
        
        echo json_encode($response);
        
        // Log successful registration for debugging
        error_log("Registration completed successfully for user: $userId");
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Database transaction rolled back for user registration: " . $e->getMessage());
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    error_log("Registration error: " . $e->getMessage());
    error_log("Registration error trace: " . $e->getTraceAsString());
}
?>
