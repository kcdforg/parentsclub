<?php
/**
 * Public Feature Switches API
 * Allows public pages to check which features are enabled
 * No authentication required - only returns public feature status
 */

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
    $db = Database::getInstance()->getConnection();
    
    // Get all enabled feature switches
    $sql = "SELECT feature_key, feature_name, is_enabled, category 
            FROM feature_switches 
            ORDER BY category, feature_name";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $switches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Create easy lookup arrays
    $enabledFeatures = [];
    $allFeatures = [];
    
    foreach ($switches as $switch) {
        $allFeatures[$switch['feature_key']] = [
            'name' => $switch['feature_name'],
            'enabled' => (bool) $switch['is_enabled'],
            'category' => $switch['category']
        ];
        
        if ($switch['is_enabled']) {
            $enabledFeatures[] = $switch['feature_key'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'enabled_features' => $enabledFeatures,
        'all_features' => $allFeatures
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch feature switches']);
    error_log("Error fetching public feature switches: " . $e->getMessage());
}
?>
