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
    
    // Login with phone number - check both users table and user_profiles table
    $stmt = $db->prepare("
        SELECT u.*, p.profile_completed, p.full_name 
        FROM users u 
        LEFT JOIN user_profiles p ON u.id = p.user_id 
        WHERE (u.phone = ? OR p.phone = ?) AND u.is_active = 1
    ");
    $stmt->execute([$phone, $phone]);
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
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'enrollment_number' => $user['enrollment_number'],
            'user_number' => $user['user_number'],
            'approval_status' => $user['approval_status'],
            'profile_completed' => (bool)$user['profile_completed'],
            'full_name' => $user['full_name'],
            'referred_by' => $referredByDisplay
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("User login error: " . $e->getMessage());
}
?>
