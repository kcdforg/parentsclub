<?php
/**
 * Database Setup Script
 * Provides a simple interface to run database migrations
 */

require_once '../../config/database.php';
require_once '../../middleware/admin_auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Require admin authentication
requireAdminAuth();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetStatus();
            break;
        case 'POST':
            handleRunMigrations();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Database Setup Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'details' => $e->getMessage()]);
}

function handleGetStatus() {
    global $pdo;
    
    try {
        // Check if form_values table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'form_values'");
        $tableExists = $stmt->rowCount() > 0;
        
        $status = [
            'table_exists' => $tableExists,
            'data_counts' => [],
            'relationships_count' => 0,
            'migrations_executed' => []
        ];
        
        if ($tableExists) {
            // Get data counts
            $stmt = $pdo->query("
                SELECT type, COUNT(*) as count 
                FROM form_values 
                GROUP BY type 
                ORDER BY type
            ");
            $counts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            $status['data_counts'] = $counts;
            
            // Get relationships count
            $stmt = $pdo->query("
                SELECT COUNT(*) 
                FROM form_values 
                WHERE parent_id IS NOT NULL
            ");
            $status['relationships_count'] = (int)$stmt->fetchColumn();
            
            // Check if migrations table exists and get executed migrations
            $stmt = $pdo->query("SHOW TABLES LIKE 'migrations'");
            if ($stmt->rowCount() > 0) {
                $stmt = $pdo->query("
                    SELECT migration_name, executed_at, success, error_message 
                    FROM migrations 
                    ORDER BY executed_at DESC
                ");
                $status['migrations_executed'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        
        echo json_encode([
            'success' => true,
            'status' => $status
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function handleRunMigrations() {
    try {
        // Include the migration runner
        require_once '../../migrations/run_migration.php';
        
        // Capture output
        ob_start();
        
        // Create migration runner and run migrations
        $runner = new MigrationRunner();
        $success = $runner->runAllMigrations();
        
        // Get output
        $output = ob_get_clean();
        
        echo json_encode([
            'success' => $success,
            'output' => $output,
            'message' => $success ? 'Database setup completed successfully!' : 'Database setup encountered errors'
        ]);
        
    } catch (Exception $e) {
        // Clean output buffer if needed
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        echo json_encode([
            'success' => false,
            'error' => 'Migration error: ' . $e->getMessage()
        ]);
    }
}
?>
