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
    
    if (!$input || !isset($input['phone']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Phone and password are required']);
        exit;
    }
    
    $phone = trim($input['phone']); // Full phone number with country code
    $password = $input['password'];
    
    if (empty($phone) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Phone and password cannot be empty']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Validate phone number format (country code + 7-15 digits)
    if (!preg_match('/^\+\d{1,4}\d{7,15}$/', $phone)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid phone number format. Must include country code and be 7-15 digits.']);
        exit;
    }
    
    // Login with phone number - check users table with comprehensive profile status
    $stmt = $db->prepare("
        SELECT u.*, 
               up.intro_completed, 
               up.questions_completed, 
               up.profile_completion_step,
               up.name,
               up.gender,
               up.marriageType,
               up.hasChildren,
               up.isMarried,
               up.full_name,
               CASE 
                   -- For invitation-based users: check introduction first, then profile
                   WHEN u.created_via_invitation = 1 AND (up.intro_completed IS NULL OR up.intro_completed = 0 OR up.questions_completed IS NULL OR up.questions_completed = 0) THEN 'intro_required'
                   WHEN u.created_via_invitation = 1 AND up.intro_completed = 1 AND up.questions_completed = 1 AND (up.profile_completion_step IS NULL OR up.profile_completion_step != 'completed') THEN 'profile_required'
                   WHEN u.created_via_invitation = 1 AND up.profile_completion_step = 'completed' THEN 'completed'
                   -- For non-invitation users: use old profile-based logic
                   WHEN u.created_via_invitation = 0 OR u.created_via_invitation IS NULL THEN 
                       CASE 
                           WHEN u.profile_completed = 0 OR u.profile_completed IS NULL THEN 'profile_required'
                           ELSE 'dashboard'
                       END
                   ELSE 'dashboard'
               END as next_step
        FROM users u 
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        WHERE u.phone = ? AND u.is_active = 1
    ");
    $stmt->execute([$phone]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Phone number not found. Please check your phone number or contact support.']);
        exit;
    }
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    $sessionManager = SessionManager::getInstance();
    $sessionId = $sessionManager->createSession('user', $user['id'], [
        'email' => $user['email'],
        'enrollment_number' => $user['enrollment_number']
    ]);
    
    // Determine referred by display
    $referredByDisplay = 'Direct';
    if ($user['referred_by_type'] === 'admin') {
        $stmt = $db->prepare("SELECT username FROM admin_users WHERE id = ?");
        $stmt->execute([$user['referred_by_id']]);
        $admin = $stmt->fetch();
        $referredByDisplay = 'Admin: ' . ($admin['username'] ?? 'Unknown');
    } elseif ($user['referred_by_type'] === 'user') {
        $stmt = $db->prepare("SELECT user_number FROM users WHERE id = ?");
        $stmt->execute([$user['referred_by_id']]);
        $referrer = $stmt->fetch();
        $referredByDisplay = 'User: ' . ($referrer['user_number'] ?? 'Unknown');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'session_token' => $sessionId,
        'next_step' => $user['next_step'],
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'enrollment_number' => $user['enrollment_number'],
            'user_number' => $user['user_number'],
            'approval_status' => $user['approval_status'],
            'profile_completed' => (bool)$user['profile_completed'],
            'full_name' => $user['name'] ?: ($user['full_name'] ?? ''),
            'referred_by' => $referredByDisplay,
            'intro_completed' => (bool)$user['intro_completed'],
            'questions_completed' => (bool)$user['questions_completed'],
            'profile_completion_step' => $user['profile_completion_step'],
            'created_via_invitation' => (bool)$user['created_via_invitation']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("User login error: " . $e->getMessage());
}
?>
