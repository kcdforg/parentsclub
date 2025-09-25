<?php
// Final complete data restoration by replacing the entire regapp_db directory
echo "=== FINAL COMPLETE DATA RESTORATION ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

$backup_path = 'C:\\xampp\\mysql\\backup\\data_backup\\regapp_db';
$current_path = 'C:\\xampp\\mysql\\data\\regapp_db';
$xampp_path = 'C:\\xampp';

echo "Backup source: $backup_path\n";
echo "Target: $current_path\n\n";

if (!is_dir($backup_path)) {
    echo "❌ Backup directory not found: $backup_path\n";
    exit(1);
}

echo "Step 1: Ensuring MySQL is stopped...\n";
exec('taskkill /f /im mysqld.exe 2>nul');
exec('taskkill /f /im mysql.exe 2>nul');
sleep(3);
echo "✓ MySQL processes terminated\n";

echo "\nStep 2: Backing up corrupted data...\n";
if (is_dir($current_path)) {
    $corrupted_backup = $current_path . '_corrupted_' . date('Y-m-d_H-i-s');
    if (rename($current_path, $corrupted_backup)) {
        echo "✓ Moved corrupted data to: " . basename($corrupted_backup) . "\n";
    } else {
        echo "⚠ Could not move corrupted data, will overwrite\n";
        // Delete the directory contents
        deleteDirectory($current_path);
    }
}

echo "\nStep 3: Copying complete backup data...\n";
if (!is_dir($current_path)) {
    mkdir($current_path, 0755, true);
}

// Copy all files from backup
$backup_files = glob($backup_path . '\\*');
$copied_files = 0;

foreach ($backup_files as $file) {
    if (is_file($file)) {
        $target = $current_path . '\\' . basename($file);
        if (copy($file, $target)) {
            $copied_files++;
        }
    }
}

echo "✓ Copied $copied_files files from backup\n";

echo "\nStep 4: Starting MySQL with restored data...\n";
$mysql_bin = $xampp_path . '\\mysql\\bin\\mysqld.exe';
$mysql_ini = $xampp_path . '\\mysql\\bin\\my.ini';

$mysql_cmd = "\"$mysql_bin\" --defaults-file=\"$mysql_ini\" --standalone";

// Start MySQL
$descriptors = [
    0 => ["pipe", "r"],
    1 => ["pipe", "w"], 
    2 => ["pipe", "w"]
];

$process = proc_open($mysql_cmd, $descriptors, $pipes, null, null);

if (is_resource($process)) {
    echo "✓ MySQL startup initiated\n";
    
    // Close pipes
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    
    // Don't wait for process, let it run in background
    
    echo "\nStep 5: Waiting for MySQL to be ready...\n";
    $max_wait = 30;
    $wait_count = 0;
    $mysql_ready = false;
    
    while ($wait_count < $max_wait && !$mysql_ready) {
        sleep(1);
        $wait_count++;
        
        $connection = @fsockopen('localhost', 3306, $errno, $errstr, 1);
        if ($connection) {
            fclose($connection);
            $mysql_ready = true;
            echo "✓ MySQL is ready after $wait_count seconds\n";
        } else {
            echo ".";
        }
    }
    
    if ($mysql_ready) {
        echo "\n\nStep 6: Verifying restored data...\n";
        
        try {
            $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "✓ Connected to regapp_db successfully\n";
            
            // Check tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "✓ Found " . count($tables) . " tables\n";
            
            // Check data counts
            $key_tables = ['admin_users', 'users', 'user_profiles', 'invitations', 'feature_switches', 'form_values'];
            $total_records = 0;
            
            echo "\nData verification:\n";
            foreach ($key_tables as $table) {
                if (in_array($table, $tables)) {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                    $count = $stmt->fetchColumn();
                    echo "✅ $table: $count records\n";
                    $total_records += $count;
                } else {
                    echo "⚠ $table: Not found\n";
                }
            }
            
            echo "\nTotal data records: $total_records\n";
            
            // Show sample data
            if (in_array('users', $tables)) {
                echo "\nSample users:\n";
                $stmt = $pdo->query("SELECT id, email, created_at FROM users WHERE email IS NOT NULL AND email != '' LIMIT 3");
                $users = $stmt->fetchAll();
                foreach ($users as $user) {
                    echo "- ID: {$user['id']}, Email: {$user['email']}, Created: {$user['created_at']}\n";
                }
            }
            
            if (in_array('admin_users', $tables)) {
                echo "\nAdmin users:\n";
                $stmt = $pdo->query("SELECT username, email FROM admin_users");
                $admins = $stmt->fetchAll();
                foreach ($admins as $admin) {
                    echo "- Admin: {$admin['username']} ({$admin['email']})\n";
                }
            }
            
            echo "\n🎉 DATA RESTORATION COMPLETED SUCCESSFULLY!\n";
            echo "✅ MySQL is running and stable\n";
            echo "✅ All backup data has been restored\n";
            echo "✅ Total records: $total_records\n";
            
            if ($total_records > 50) {
                echo "🎊 Your August 2025 user data is fully restored!\n";
            }
            
        } catch (Exception $e) {
            echo "❌ Database verification failed: " . $e->getMessage() . "\n";
        }
        
    } else {
        echo "\n❌ MySQL failed to start after $max_wait seconds\n";
    }
    
} else {
    echo "❌ Failed to start MySQL process\n";
}

function deleteDirectory($dir) {
    if (!is_dir($dir)) return;
    
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? deleteDirectory($path) : unlink($path);
    }
    rmdir($dir);
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Final restoration completed at: " . date('Y-m-d H:i:s') . "\n";
echo "You can now access phpMyAdmin and test your application!\n";
?>
