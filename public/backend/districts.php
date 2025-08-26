<?php
require_once '../../config/database.php';
require_once '../../config/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Districts API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGet() {
    global $pdo;
    
    try {
        $state = $_GET['state'] ?? null;
        
        if ($state) {
            // Get districts for a specific state
            $stmt = $pdo->prepare("
                SELECT DISTINCT district_name as name 
                FROM districts 
                WHERE state = ? 
                ORDER BY district_name ASC
            ");
            $stmt->execute([$state]);
            $districts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $districts
            ]);
        } else {
            // Get all states
            $stmt = $pdo->prepare("
                SELECT DISTINCT state 
                FROM districts 
                ORDER BY state ASC
            ");
            $stmt->execute();
            $states = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'success' => true,
                'data' => $states
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Database error in handleGet: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}
?>
