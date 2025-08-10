<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

// Authenticate user
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization token required']);
    exit;
}

$sessionToken = $matches[1];
$sessionManager = SessionManager::getInstance();
$user = $sessionManager->getUserFromSession($sessionToken);

if (!$user || $user['user_type'] !== 'user') {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired session']);
    exit;
}

// Check if user is approved
if ($user['approval_status'] !== 'approved') {
    http_response_code(403);
    echo json_encode(['error' => 'Account not approved yet']);
    exit;
}

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get user subscriptions
            $stmt = $db->prepare("
                SELECT * FROM subscriptions 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$user['id']]);
            $subscriptions = $stmt->fetchAll();
            
            // Get active subscription
            $stmt = $db->prepare("
                SELECT * FROM subscriptions 
                WHERE user_id = ? AND status = 'active' AND end_date > NOW()
                ORDER BY end_date DESC 
                LIMIT 1
            ");
            $stmt->execute([$user['id']]);
            $activeSubscription = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'subscriptions' => $subscriptions,
                'active_subscription' => $activeSubscription,
                'has_active_subscription' => (bool)$activeSubscription
            ]);
            break;
            
        case 'POST':
            // Subscribe to annual membership
            $input = json_decode(file_get_contents('php://input'), true);
            
            $subscriptionType = $input['subscription_type'] ?? 'annual';
            $paymentMethod = $input['payment_method'] ?? 'placeholder';
            
            // Check if user already has an active subscription
            $stmt = $db->prepare("
                SELECT id FROM subscriptions 
                WHERE user_id = ? AND status = 'active' AND end_date > NOW()
            ");
            $stmt->execute([$user['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'You already have an active subscription']);
                exit;
            }
            
            // Set subscription details
            $amount = 999.00; // Annual membership amount
            $startDate = date('Y-m-d');
            $endDate = date('Y-m-d', strtotime('+1 year'));
            
            // For now, we'll create a pending subscription
            // In a real application, this would integrate with a payment gateway
            $stmt = $db->prepare("
                INSERT INTO subscriptions (user_id, subscription_type, status, start_date, end_date, amount, payment_method)
                VALUES (?, ?, 'pending', ?, ?, ?, ?)
            ");
            $stmt->execute([$user['id'], $subscriptionType, $startDate, $endDate, $amount, $paymentMethod]);
            
            $subscriptionId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Subscription created successfully',
                'subscription_id' => $subscriptionId,
                'amount' => $amount,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'pending',
                'note' => 'This is a placeholder for payment integration. In production, this would process payment and activate the subscription.'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Subscription API error: " . $e->getMessage());
}
?>
