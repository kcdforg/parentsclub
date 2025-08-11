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
    
    if (!$input || !isset($input['token']) || !isset($input['new_password']) || !isset($input['confirm_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and passwords are required']);
        exit;
    }
    
    $token = trim($input['token']);
    $newPassword = $input['new_password'];
    $confirmPassword = $input['confirm_password'];
    
    // Validate inputs
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid reset token']);
        exit;
    }
    
    if (empty($newPassword) || strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters long']);
        exit;
    }
    
    if ($newPassword !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Passwords do not match']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Find the reset request with the token
    $stmt = $db->prepare("
        SELECT prr.*, u.id as user_id, u.email, up.full_name
        FROM password_reset_requests prr
        JOIN users u ON prr.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE prr.reset_token = ? AND prr.status = 'approved' AND prr.reset_token_expires > NOW()
    ");
    $stmt->execute([$token]);
    $resetRequest = $stmt->fetch();
    
    if (!$resetRequest) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        exit;
    }
    
    $db->beginTransaction();
    
    try {
        // Hash the new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update user password
        $stmt = $db->prepare("UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?");
        $stmt->execute([$hashedPassword, $resetRequest['user_id']]);
        
        // Mark reset request as used
        $stmt = $db->prepare("UPDATE password_reset_requests SET status = 'used', used_at = NOW() WHERE id = ?");
        $stmt->execute([$resetRequest['id']]);
        
        $db->commit();
        
        // Log the password reset
        error_log("Password reset completed for user: " . $resetRequest['email'] . " (ID: " . $resetRequest['user_id'] . ") at " . date('Y-m-d H:i:s'));
        
        echo json_encode([
            'success' => true,
            'message' => 'Password reset successfully! You can now login with your new password.',
            'user_name' => $resetRequest['full_name'] ?? 'User'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while resetting your password. Please try again.']);
}
?>
