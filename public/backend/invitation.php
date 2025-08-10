<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $invitationCode = $_GET['code'] ?? '';
    
    if (empty($invitationCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invitation code is required']);
        exit;
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Get invitation details
    $stmt = $db->prepare("
        SELECT i.*, 
               CASE 
                   WHEN i.invited_by_type = 'admin' THEN a.username
                   ELSE CONCAT('User #', u.user_number)
               END as invited_by_display
        FROM invitations i
        LEFT JOIN admin_users a ON i.invited_by_type = 'admin' AND i.invited_by_id = a.id
        LEFT JOIN users u ON i.invited_by_type = 'user' AND i.invited_by_id = u.id
        WHERE i.invitation_code = ?
    ");
    $stmt->execute([$invitationCode]);
    $invitation = $stmt->fetch();
    
    if (!$invitation) {
        http_response_code(404);
        echo json_encode(['error' => 'Invitation not found']);
        exit;
    }
    
    // Check if invitation is still valid
    $now = new DateTime();
    $expiresAt = new DateTime($invitation['expires_at']);
    
    if ($invitation['status'] !== 'pending') {
        echo json_encode([
            'success' => false,
            'error' => 'Invitation has already been used or expired',
            'invitation' => [
                'status' => $invitation['status'],
                'invited_name' => $invitation['invited_name'],
                'invited_email' => $invitation['invited_email']
            ]
        ]);
        exit;
    }
    
    if ($now > $expiresAt) {
        // Mark invitation as expired
        $stmt = $db->prepare("UPDATE invitations SET status = 'expired' WHERE id = ?");
        $stmt->execute([$invitation['id']]);
        
        echo json_encode([
            'success' => false,
            'error' => 'Invitation has expired',
            'invitation' => [
                'status' => 'expired',
                'invited_name' => $invitation['invited_name'],
                'invited_email' => $invitation['invited_email'],
                'expires_at' => $invitation['expires_at']
            ]
        ]);
        exit;
    }
    
    // Return valid invitation details
    echo json_encode([
        'success' => true,
        'invitation' => [
            'invitation_code' => $invitation['invitation_code'],
            'invited_name' => $invitation['invited_name'],
            'invited_email' => $invitation['invited_email'],
            'invited_by_type' => $invitation['invited_by_type'],
            'invited_by_display' => $invitation['invited_by_display'],
            'expires_at' => $invitation['expires_at'],
            'status' => $invitation['status']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Invitation API error: " . $e->getMessage());
}
?>
