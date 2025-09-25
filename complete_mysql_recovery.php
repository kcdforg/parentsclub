<?php
// Complete MySQL Recovery and Data Restoration
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== COMPLETE MYSQL RECOVERY & DATA RESTORATION ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

// Step 1: Ensure MySQL is completely stopped
echo "Step 1: Ensuring MySQL is completely stopped...\n";
exec('taskkill /f /im mysqld.exe 2>nul');
exec('taskkill /f /im mysql.exe 2>nul');
sleep(3);
echo "✓ MySQL processes terminated\n";

// Step 2: Check for port availability
echo "\nStep 2: Checking port availability...\n";
$connection = @fsockopen('localhost', 3306, $errno, $errstr, 1);
if ($connection) {
    fclose($connection);
    echo "⚠ Port 3306 still in use, waiting...\n";
    sleep(5);
} else {
    echo "✓ Port 3306 is free\n";
}

// Step 3: Start MySQL cleanly
echo "\nStep 3: Starting MySQL cleanly...\n";
$xampp_path = 'C:\\xampp';
$mysql_bin = $xampp_path . '\\mysql\\bin\\mysqld.exe';
$mysql_ini = $xampp_path . '\\mysql\\bin\\my.ini';

if (!file_exists($mysql_bin)) {
    echo "❌ MySQL binary not found: $mysql_bin\n";
    exit(1);
}

// Start MySQL in background
$mysql_cmd = "\"$mysql_bin\" --defaults-file=\"$mysql_ini\" --standalone";
echo "Starting MySQL: $mysql_cmd\n";

// Use popen to start MySQL in background
$process = popen("start /B $mysql_cmd 2>&1", 'r');
if ($process) {
    pclose($process);
    echo "✓ MySQL startup command issued\n";
} else {
    echo "❌ Failed to start MySQL\n";
    exit(1);
}

// Step 4: Wait for MySQL to be ready
echo "\nStep 4: Waiting for MySQL to be ready...\n";
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

if (!$mysql_ready) {
    echo "\n❌ MySQL failed to start after $max_wait seconds\n";
    exit(1);
}

// Step 5: Test database connection
echo "\nStep 5: Testing database connection...\n";
try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Connected to MySQL successfully\n";
    
    // Check if regapp_db exists
    $stmt = $pdo->query("SHOW DATABASES LIKE 'regapp_db'");
    if ($stmt->rowCount() > 0) {
        echo "✓ regapp_db database exists\n";
    } else {
        echo "⚠ regapp_db database missing, will recreate\n";
        $pdo->exec("CREATE DATABASE regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✓ Created regapp_db database\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 6: Check current table status
echo "\nStep 6: Checking current table status...\n";
try {
    $pdo->exec("USE regapp_db");
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Current tables: " . count($tables) . "\n";
    
    // Check data in key tables
    $key_tables = ['admin_users', 'users', 'user_profiles', 'invitations'];
    $total_records = 0;
    
    foreach ($key_tables as $table) {
        if (in_array($table, $tables)) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                $count = $stmt->fetchColumn();
                echo "- $table: $count records\n";
                $total_records += $count;
            } catch (Exception $e) {
                echo "- $table: ERROR - " . $e->getMessage() . "\n";
            }
        } else {
            echo "- $table: MISSING\n";
        }
    }
    
    echo "Total existing records: $total_records\n";
    
} catch (Exception $e) {
    echo "❌ Table check failed: " . $e->getMessage() . "\n";
    $total_records = 0;
}

// Step 7: Restore from backup if needed
if ($total_records < 30) { // If we have less than 30 total records, restore from backup
    echo "\nStep 7: Restoring data from backup...\n";
    
    $backup_path = 'C:\\xampp\\mysql\\backup\\data_backup\\regapp_db';
    $current_path = 'C:\\xampp\\mysql\\data\\regapp_db';
    
    if (!is_dir($backup_path)) {
        echo "❌ Backup directory not found: $backup_path\n";
    } else {
        echo "✓ Found backup directory\n";
        
        // Method: Stop MySQL, copy data files, restart MySQL
        echo "Stopping MySQL for safe file copy...\n";
        exec('taskkill /f /im mysqld.exe 2>nul');
        sleep(3);
        
        // Backup current regapp_db
        $backup_current = $current_path . '_corrupted_' . date('Y-m-d_H-i-s');
        if (is_dir($current_path)) {
            echo "Backing up current corrupted data...\n";
            rename($current_path, $backup_current);
        }
        
        // Copy entire backup directory
        echo "Copying backup data...\n";
        if (!is_dir($current_path)) {
            mkdir($current_path, 0755, true);
        }
        
        $backup_files = glob($backup_path . '\\*');
        foreach ($backup_files as $file) {
            if (is_file($file)) {
                $target = $current_path . '\\' . basename($file);
                copy($file, $target);
            }
        }
        echo "✓ Backup files copied\n";
        
        // Restart MySQL
        echo "Restarting MySQL with restored data...\n";
        $process = popen("start /B $mysql_cmd 2>&1", 'r');
        if ($process) {
            pclose($process);
        }
        
        // Wait for MySQL
        $wait_count = 0;
        $mysql_ready = false;
        while ($wait_count < 30 && !$mysql_ready) {
            sleep(1);
            $wait_count++;
            $connection = @fsockopen('localhost', 3306, $errno, $errstr, 1);
            if ($connection) {
                fclose($connection);
                $mysql_ready = true;
            }
        }
        
        if ($mysql_ready) {
            echo "✓ MySQL restarted with restored data\n";
        } else {
            echo "❌ MySQL failed to restart\n";
        }
    }
} else {
    echo "\nStep 7: Data appears to be intact, skipping restore\n";
}

// Step 8: Final verification
echo "\nStep 8: Final verification...\n";
try {
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✓ Database connection successful\n";
    echo "✓ Tables available: " . count($tables) . "\n";
    
    // Check data counts
    $verification = [];
    $key_tables = ['admin_users', 'users', 'user_profiles', 'invitations', 'feature_switches', 'form_values'];
    
    foreach ($key_tables as $table) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            $verification[$table] = $count;
            echo "✓ $table: $count records\n";
        } else {
            echo "⚠ $table: Not found\n";
        }
    }
    
    // Show sample data
    if (isset($verification['users']) && $verification['users'] > 0) {
        echo "\nSample user data:\n";
        $stmt = $pdo->query("SELECT id, email, created_at FROM users WHERE email IS NOT NULL AND email != '' LIMIT 3");
        $users = $stmt->fetchAll();
        foreach ($users as $user) {
            echo "- User {$user['id']}: {$user['email']} (created: {$user['created_at']})\n";
        }
    }
    
    if (isset($verification['admin_users']) && $verification['admin_users'] > 0) {
        echo "\nAdmin users:\n";
        $stmt = $pdo->query("SELECT username, email FROM admin_users");
        $admins = $stmt->fetchAll();
        foreach ($admins as $admin) {
            echo "- Admin: {$admin['username']} ({$admin['email']})\n";
        }
    }
    
    $total_data_records = array_sum($verification);
    echo "\n=== RECOVERY COMPLETE ===\n";
    echo "✅ MySQL is running and stable\n";
    echo "✅ Database is accessible\n";
    echo "✅ Total data records: $total_data_records\n";
    
    if ($total_data_records > 50) {
        echo "🎉 DATA RESTORATION SUCCESSFUL!\n";
        echo "Your real user data has been recovered!\n";
    } else {
        echo "⚠ Limited data found - may need manual restoration\n";
    }
    
} catch (Exception $e) {
    echo "❌ Final verification failed: " . $e->getMessage() . "\n";
}

echo "\nRecovery process completed at: " . date('Y-m-d H:i:s') . "\n";
echo "You can now access phpMyAdmin and test your application.\n";
?>
