<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }
    
    $email = trim(strtolower($input['email']));
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email cannot be empty']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Check if user exists (any registered user)
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.profile_completed, up.profile_completed as user_profile_completed, up.full_name
        FROM users u 
        LEFT JOIN user_profiles up ON u.id = up.user_id 
        WHERE u.email = ? AND u.is_active = 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Return same message for non-existent users to prevent email enumeration
        echo json_encode([
            'success' => true,
            'message' => 'Password reset request sent. If this email is registered, an admin will review your request.'
        ]);
        exit;
    }
    
    // Check for existing pending request
    $stmt = $db->prepare("
        SELECT id FROM password_reset_requests 
        WHERE user_id = ? AND status = 'pending' 
        AND requested_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute([$user['id']]);
    $existingRequest = $stmt->fetch();
    
    if ($existingRequest) {
        echo json_encode([
            'success' => true,
            'message' => 'A password reset request is already pending. Please wait for admin approval or try again later.'
        ]);
        exit;
    }
    
    // Generate secure request token
    $requestToken = bin2hex(random_bytes(32));
    
    // Get client info
    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Create password reset request
    $stmt = $db->prepare("
        INSERT INTO password_reset_requests (user_id, request_token, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$user['id'], $requestToken, $ipAddress, $userAgent]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create reset request. Please try again.']);
        exit;
    }
    
    // Log the reset request
    error_log("Password reset requested for user: " . $user['email'] . " (ID: " . $user['id'] . ") at " . date('Y-m-d H:i:s'));
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset request sent. An admin will review your request and provide a reset link if approved.',
        'user_name' => $user['full_name'] ?? 'User'
    ]);
    
} catch (Exception $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while processing your request. Please try again.']);
}
?>
