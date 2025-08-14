<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Authenticate admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$admin = $sessionManager->getUserFromSession($sessionToken);

if (!$admin || $admin['user_type'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get dashboard statistics
    $stats = [];
    
    // Validate admin session is still valid
    if (!$admin || !$admin['is_active']) {
        http_response_code(401);
        echo json_encode(['error' => 'Admin account is not active']);
        exit;
    }
    
    // Total users
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
    $stats['total_users'] = $stmt->fetch()['total'];
    
    // Pending approvals
    $stmt = $db->query("SELECT COUNT(*) as pending FROM users WHERE approval_status = 'pending' AND is_active = 1");
    $stats['pending_approvals'] = $stmt->fetch()['pending'];
    
    // Approved users
    $stmt = $db->query("SELECT COUNT(*) as approved FROM users WHERE approval_status = 'approved' AND is_active = 1");
    $stats['approved_users'] = $stmt->fetch()['approved'];
    
    // Active subscriptions
    $stmt = $db->query("SELECT COUNT(*) as active FROM subscriptions WHERE status = 'active'");
    $stats['active_subscriptions'] = $stmt->fetch()['active'];
    
    // Pending invitations
    $stmt = $db->query("SELECT COUNT(*) as pending FROM invitations WHERE status = 'pending' AND expires_at > NOW()");
    $stats['pending_invitations'] = $stmt->fetch()['pending'];
    
    // Recent users (last 10)
    $stmt = $db->query("
        SELECT u.id, u.enrollment_number, u.approval_status, u.created_at,
               p.full_name, p.phone
        FROM users u 
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.is_active = 1
        ORDER BY u.created_at DESC 
        LIMIT 10
    ");
    $recent_users = $stmt->fetchAll();
    
    // Recent invitations (last 10)
    $stmt = $db->query("
        SELECT i.*, a.username as admin_name
        FROM invitations i
        LEFT JOIN admin_users a ON i.invited_by_type = 'admin' AND i.invited_by_id = a.id
        ORDER BY i.created_at DESC 
        LIMIT 10
    ");
    $recent_invitations = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recent_users' => $recent_users,
        'recent_invitations' => $recent_invitations,
        'admin' => [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Dashboard error: " . $e->getMessage());
}
?>
