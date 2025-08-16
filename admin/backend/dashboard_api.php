<?php
header('Content-Type: application/json');
session_start();

// Check if admin is logged in for API access
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Admin session not active.']);
    exit;
}

require_once '../../config/database.php';

try {
    $db = Database::getInstance()->getConnection();

    // Fetch dashboard statistics
    $totalUsersStmt = $db->query("SELECT COUNT(*) FROM users");
    $totalUsers = $totalUsersStmt->fetchColumn();

    $pendingApprovalsStmt = $db->query("SELECT COUNT(*) FROM users WHERE approval_status = 'pending'");
    $pendingApprovals = $pendingApprovalsStmt->fetchColumn();

    $activeInvitationsStmt = $db->query("SELECT COUNT(*) FROM invitations WHERE status = 'pending' AND expires_at > NOW()");
    $activeInvitations = $activeInvitationsStmt->fetchColumn();

    $stats = [
        'total_users' => $totalUsers,
        'pending_approvals' => $pendingApprovals,
        'active_invitations' => $activeInvitations,
        // Growth rate is not directly available from simple counts, set to 0% for now
        'growth_rate' => '0%'
    ];

    // Fetch recent users
    $recentUsersStmt = $db->query("SELECT phone, approval_status FROM users ORDER BY created_at DESC LIMIT 5");
    $recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recent_users' => $recentUsers
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    error_log("Dashboard API database error: " . $e->getMessage());
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    error_log("Dashboard API server error: " . $e->getMessage());
}
?>
