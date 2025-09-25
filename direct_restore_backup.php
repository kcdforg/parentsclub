<?php
// Direct restoration using MySQL copy operation
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DIRECT DATA RESTORE FROM BACKUP ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

// Paths
$backup_path = 'C:\\xampp\\mysql\\backup\\data_backup\\regapp_db';
$current_path = 'C:\\xampp\\mysql\\data\\regapp_db';

echo "Backup source: $backup_path\n";
echo "Current target: $current_path\n\n";

if (!is_dir($backup_path)) {
    echo "❌ Backup directory not found!\n";
    exit(1);
}

echo "=== Backup Analysis ===\n";
$backup_files = glob($backup_path . '\\*.ibd'); // Data files
echo "Found " . count($backup_files) . " data files in backup\n";

foreach ($backup_files as $file) {
    $table = basename($file, '.ibd');
    $size = filesize($file);
    echo "- $table: " . formatBytes($size) . "\n";
}

echo "\n=== Starting Direct Restore ===\n";

try {
    // Test current MySQL connection
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ MySQL is running\n";
    
    // Get current tables
    $stmt = $pdo->query("SHOW TABLES");
    $current_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Current tables: " . count($current_tables) . "\n";
    
    // Method 1: Try to copy specific key data files
    echo "\n=== Method 1: Copy Key Data Files ===\n";
    
    $key_tables = ['admin_users', 'users', 'user_profiles', 'invitations'];
    
    foreach ($key_tables as $table) {
        $backup_ibd = $backup_path . '\\' . $table . '.ibd';
        $backup_frm = $backup_path . '\\' . $table . '.frm';
        
        if (file_exists($backup_ibd)) {
            echo "Processing $table...\n";
            
            // Discard current tablespace
            try {
                $pdo->exec("ALTER TABLE `$table` DISCARD TABLESPACE");
                echo "  ✓ Discarded current tablespace for $table\n";
            } catch (Exception $e) {
                echo "  ⚠ Could not discard tablespace: " . $e->getMessage() . "\n";
            }
            
            // Copy the backup .ibd file
            $current_ibd = $current_path . '\\' . $table . '.ibd';
            if (file_exists($current_ibd)) {
                unlink($current_ibd);
            }
            
            if (copy($backup_ibd, $current_ibd)) {
                echo "  ✓ Copied .ibd file\n";
                
                // Import tablespace
                try {
                    $pdo->exec("ALTER TABLE `$table` IMPORT TABLESPACE");
                    echo "  ✓ Imported tablespace for $table\n";
                    
                    // Verify data
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                    $count = $stmt->fetchColumn();
                    echo "  ✓ $table now has $count records\n";
                    
                } catch (Exception $e) {
                    echo "  ❌ Import failed: " . $e->getMessage() . "\n";
                }
            } else {
                echo "  ❌ Failed to copy .ibd file\n";
            }
        } else {
            echo "❌ Backup file not found: $backup_ibd\n";
        }
    }
    
    echo "\n=== Verification ===\n";
    
    // Check final results
    foreach ($key_tables as $table) {
        if (in_array($table, $current_tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                echo "✅ $table: $count records restored\n";
                
                if ($table === 'users' && $count > 0) {
                    $stmt = $pdo->query("SELECT email FROM users LIMIT 2");
                    $samples = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    echo "   Sample users: " . implode(', ', $samples) . "\n";
                }
            } else {
                echo "⚠️  $table: Still empty\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

function formatBytes($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    return round($bytes / (1024 ** $pow), 2) . ' ' . $units[$pow];
}

echo "\nDirect restore attempt completed.\n";
?>
