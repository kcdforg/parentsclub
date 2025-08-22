<?php
/**
 * Database Migration Runner
 * Runs SQL migration scripts and tracks migration status
 */

require_once '../config/database.php';

class MigrationRunner {
    private $pdo;
    private $migrations_table = 'migrations';
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        $this->createMigrationsTable();
    }
    
    /**
     * Create migrations tracking table if it doesn't exist
     */
    private function createMigrationsTable() {
        $sql = "
            CREATE TABLE IF NOT EXISTS {$this->migrations_table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT NULL,
                INDEX idx_migration_name (migration_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        try {
            $this->pdo->exec($sql);
            echo "✓ Migrations tracking table ready\n";
        } catch (PDOException $e) {
            die("Error creating migrations table: " . $e->getMessage() . "\n");
        }
    }
    
    /**
     * Check if a migration has already been run
     */
    private function isMigrationExecuted($migrationName) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM {$this->migrations_table} WHERE migration_name = ? AND success = TRUE");
        $stmt->execute([$migrationName]);
        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Mark migration as executed
     */
    private function markMigrationExecuted($migrationName, $success = true, $errorMessage = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO {$this->migrations_table} (migration_name, success, error_message) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                executed_at = CURRENT_TIMESTAMP,
                success = VALUES(success),
                error_message = VALUES(error_message)
        ");
        $stmt->execute([$migrationName, $success ? 1 : 0, $errorMessage]);
    }
    
    /**
     * Execute a single migration file
     */
    public function runMigration($migrationFile) {
        $migrationName = basename($migrationFile, '.sql');
        
        if ($this->isMigrationExecuted($migrationName)) {
            echo "⚠ Migration '{$migrationName}' already executed, skipping...\n";
            return true;
        }
        
        echo "🚀 Running migration: {$migrationName}\n";
        
        if (!file_exists($migrationFile)) {
            echo "❌ Migration file not found: {$migrationFile}\n";
            return false;
        }
        
        $sql = file_get_contents($migrationFile);
        if ($sql === false) {
            echo "❌ Could not read migration file: {$migrationFile}\n";
            return false;
        }
        
        try {
            // Start transaction
            $this->pdo->beginTransaction();
            
            // Split SQL into individual statements and execute each
            $statements = $this->splitSqlStatements($sql);
            
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (empty($statement) || $statement === ';') {
                    continue;
                }
                
                // Skip comments
                if (strpos($statement, '--') === 0) {
                    continue;
                }
                
                $this->pdo->exec($statement);
            }
            
            // Mark as successful
            $this->markMigrationExecuted($migrationName, true);
            
            // Commit transaction
            $this->pdo->commit();
            
            echo "✅ Migration '{$migrationName}' completed successfully\n";
            return true;
            
        } catch (PDOException $e) {
            // Rollback transaction
            $this->pdo->rollback();
            
            $errorMessage = $e->getMessage();
            echo "❌ Migration '{$migrationName}' failed: {$errorMessage}\n";
            
            // Mark as failed
            $this->markMigrationExecuted($migrationName, false, $errorMessage);
            
            return false;
        }
    }
    
    /**
     * Split SQL content into individual statements
     */
    private function splitSqlStatements($sql) {
        // Remove SQL comments
        $sql = preg_replace('/--.*$/m', '', $sql);
        
        // Split by semicolons, but be careful with semicolons inside strings
        $statements = [];
        $current = '';
        $inString = false;
        $stringDelimiter = '';
        
        for ($i = 0; $i < strlen($sql); $i++) {
            $char = $sql[$i];
            
            if (!$inString) {
                if ($char === "'" || $char === '"') {
                    $inString = true;
                    $stringDelimiter = $char;
                } elseif ($char === ';') {
                    $statements[] = $current;
                    $current = '';
                    continue;
                }
            } else {
                if ($char === $stringDelimiter) {
                    // Check if it's escaped
                    if ($i > 0 && $sql[$i-1] !== '\\') {
                        $inString = false;
                        $stringDelimiter = '';
                    }
                }
            }
            
            $current .= $char;
        }
        
        // Add the last statement if it doesn't end with semicolon
        if (trim($current)) {
            $statements[] = $current;
        }
        
        return $statements;
    }
    
    /**
     * Run all migrations in the migrations directory
     */
    public function runAllMigrations() {
        $migrationDir = __DIR__;
        $migrationFiles = glob($migrationDir . '/*.sql');
        
        if (empty($migrationFiles)) {
            echo "No migration files found in {$migrationDir}\n";
            return false;
        }
        
        // Sort migrations by filename to ensure proper order
        sort($migrationFiles);
        
        $successCount = 0;
        $totalCount = count($migrationFiles);
        
        echo "Found {$totalCount} migration file(s)\n\n";
        
        foreach ($migrationFiles as $migrationFile) {
            if ($this->runMigration($migrationFile)) {
                $successCount++;
            }
            echo "\n";
        }
        
        echo "Migration Summary:\n";
        echo "✅ Successful: {$successCount}/{$totalCount}\n";
        
        if ($successCount < $totalCount) {
            echo "❌ Failed: " . ($totalCount - $successCount) . "/{$totalCount}\n";
            return false;
        }
        
        echo "🎉 All migrations completed successfully!\n";
        return true;
    }
    
    /**
     * Show migration status
     */
    public function showMigrationStatus() {
        echo "Migration Status:\n";
        echo "================\n";
        
        try {
            $stmt = $this->pdo->query("
                SELECT migration_name, executed_at, success, error_message 
                FROM {$this->migrations_table} 
                ORDER BY executed_at DESC
            ");
            $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($migrations)) {
                echo "No migrations have been executed yet.\n";
                return;
            }
            
            foreach ($migrations as $migration) {
                $status = $migration['success'] ? '✅' : '❌';
                $time = date('Y-m-d H:i:s', strtotime($migration['executed_at']));
                echo "{$status} {$migration['migration_name']} - {$time}\n";
                
                if (!$migration['success'] && $migration['error_message']) {
                    echo "   Error: {$migration['error_message']}\n";
                }
            }
            
        } catch (PDOException $e) {
            echo "Error retrieving migration status: " . $e->getMessage() . "\n";
        }
    }
    
    /**
     * Reset a specific migration (mark as not executed)
     */
    public function resetMigration($migrationName) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM {$this->migrations_table} WHERE migration_name = ?");
            $stmt->execute([$migrationName]);
            
            if ($stmt->rowCount() > 0) {
                echo "✅ Migration '{$migrationName}' has been reset and can be run again.\n";
            } else {
                echo "⚠ Migration '{$migrationName}' was not found in the migrations table.\n";
            }
            
        } catch (PDOException $e) {
            echo "❌ Error resetting migration: " . $e->getMessage() . "\n";
        }
    }
}

// Command line interface
if (php_sapi_name() === 'cli') {
    $runner = new MigrationRunner();
    
    $command = isset($argv[1]) ? $argv[1] : 'run';
    
    switch ($command) {
        case 'run':
            $runner->runAllMigrations();
            break;
            
        case 'status':
            $runner->showMigrationStatus();
            break;
            
        case 'reset':
            if (isset($argv[2])) {
                $runner->resetMigration($argv[2]);
            } else {
                echo "Usage: php run_migration.php reset <migration_name>\n";
            }
            break;
            
        case 'single':
            if (isset($argv[2])) {
                $migrationFile = __DIR__ . '/' . $argv[2];
                if (substr($migrationFile, -4) !== '.sql') {
                    $migrationFile .= '.sql';
                }
                $runner->runMigration($migrationFile);
            } else {
                echo "Usage: php run_migration.php single <migration_file>\n";
            }
            break;
            
        default:
            echo "Database Migration Runner\n";
            echo "========================\n";
            echo "Usage: php run_migration.php [command]\n\n";
            echo "Commands:\n";
            echo "  run              Run all pending migrations (default)\n";
            echo "  status           Show migration execution status\n";
            echo "  reset <name>     Reset a migration to allow re-execution\n";
            echo "  single <file>    Run a specific migration file\n";
            break;
    }
} else {
    // Web interface (basic)
    header('Content-Type: text/plain');
    
    if (!isset($_GET['action'])) {
        echo "Database Migration Web Interface\n";
        echo "==============================\n\n";
        echo "Available actions:\n";
        echo "?action=run     - Run all migrations\n";
        echo "?action=status  - Show migration status\n";
        exit;
    }
    
    $runner = new MigrationRunner();
    
    switch ($_GET['action']) {
        case 'run':
            $runner->runAllMigrations();
            break;
            
        case 'status':
            $runner->showMigrationStatus();
            break;
            
        default:
            echo "Unknown action: " . $_GET['action'] . "\n";
            break;
    }
}
?>
