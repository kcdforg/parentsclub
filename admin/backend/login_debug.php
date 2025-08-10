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
    
    if (!$input || !isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password cannot be empty']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Debug: Check if we can connect to database
    echo json_encode(['debug' => 'Database connection successful']);
    
    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();
    
    // Debug: Show what we found
    if ($admin) {
        echo json_encode([
            'debug' => 'Admin user found',
            'username' => $admin['username'],
            'password_hash' => $admin['password'],
            'is_active' => $admin['is_active'],
            'input_password' => $password,
            'password_verify_result' => password_verify($password, $admin['password']),
            'hash_info' => password_get_info($admin['password'])
        ]);
    } else {
        echo json_encode(['debug' => 'No admin user found with username: ' . $username]);
    }
    
    if (!$admin || !password_verify($password, $admin['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    $sessionManager = SessionManager::getInstance();
    $sessionId = $sessionManager->createSession('admin', $admin['id'], [
        'username' => $admin['username'],
        'email' => $admin['email']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'session_token' => $sessionId,
        'user' => [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'debug_message' => $e->getMessage()]);
    error_log("Admin login error: " . $e->getMessage());
}
?> 