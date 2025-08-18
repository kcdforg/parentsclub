<?php
/**
 * Feature Switches Management API
 * Allows admin users to enable/disable platform features
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../config/session.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Verify admin session for all operations
    $sessionToken = getAuthorizationToken();
    if (!$sessionToken) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        exit;
    }

    $sessionManager = SessionManager::getInstance();
    $session = $sessionManager->validateSession($sessionToken);
    
    if (!$session || $session['user_type'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $db = Database::getInstance()->getConnection();

    switch ($method) {
        case 'GET':
            listFeatureSwitches($db);
            break;
        case 'PUT':
            updateFeatureSwitch($db, $session['user_id']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    error_log("Feature Switches API error: " . $e->getMessage());
}

/**
 * List all feature switches
 */
function listFeatureSwitches($db) {
    try {
        $sql = "SELECT fs.*, au.username as updated_by_username 
                FROM feature_switches fs 
                LEFT JOIN admin_users au ON fs.updated_by_admin = au.id 
                ORDER BY fs.category, fs.feature_name";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $switches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by category for better organization
        $groupedSwitches = [];
        foreach ($switches as $switch) {
            $category = $switch['category'];
            if (!isset($groupedSwitches[$category])) {
                $groupedSwitches[$category] = [];
            }
            $groupedSwitches[$category][] = $switch;
        }
        
        echo json_encode([
            'success' => true,
            'switches' => $switches,
            'grouped_switches' => $groupedSwitches
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch feature switches']);
        error_log("Error fetching feature switches: " . $e->getMessage());
    }
}

/**
 * Update a feature switch
 */
function updateFeatureSwitch($db, $adminId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['feature_key']) || !isset($input['is_enabled'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Feature key and enabled status are required']);
            return;
        }
        
        $featureKey = $input['feature_key'];
        $isEnabled = (bool) $input['is_enabled'];
        $isEnabledInt = $isEnabled ? 1 : 0; // Convert to integer for database
        
        // Check if feature switch exists
        $checkSql = "SELECT id, feature_name FROM feature_switches WHERE feature_key = ?";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([$featureKey]);
        $existingSwitch = $checkStmt->fetch();
        
        if (!$existingSwitch) {
            http_response_code(404);
            echo json_encode(['error' => 'Feature switch not found']);
            return;
        }
        
        // Update the feature switch
        $updateSql = "UPDATE feature_switches 
                      SET is_enabled = ?, updated_by_admin = ?, updated_at = NOW() 
                      WHERE feature_key = ?";
        $updateStmt = $db->prepare($updateSql);
        $updateStmt->execute([$isEnabledInt, $adminId, $featureKey]);
        
        if ($updateStmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => "Feature '{$existingSwitch['feature_name']}' " . ($isEnabled ? 'enabled' : 'disabled') . " successfully"
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'No changes made - feature switch was already in the requested state'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update feature switch']);
        error_log("Error updating feature switch: " . $e->getMessage());
    }
}

/**
 * Helper function to get authorization token
 */
function getAuthorizationToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') === 0) {
            return substr($auth, 7);
        }
    }
    return null;
}
?>
