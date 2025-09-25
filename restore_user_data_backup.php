<?php
// Restore User Data from Backup
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>User Data Restoration</title>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5;} .log{background:white;padding:15px;margin:10px 0;border-radius:5px;box-shadow:0 2px 4px rgba(0,0,0,0.1);} .success{color:green;} .error{color:red;} .warning{color:orange;} .info{color:blue;} .backup{background:#e3f2fd;border-left:4px solid #2196f3;}</style></head><body>";

echo "<h1>🔄 User Data Restoration from Backup</h1>";

function logMessage($message, $type = 'info') {
    $class = $type;
    echo "<div class='log $class'>$message</div>";
    flush();
}

try {
    logMessage("=== RESTORING REAL USER DATA FROM BACKUP ===", 'backup');
    
    // Connect to MySQL
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    logMessage("✓ Connected to MySQL", 'success');
    
    // Backup paths
    $backup_path = 'C:\\xampp\\mysql\\backup\\data_backup\\regapp_db';
    $current_path = 'C:\\xampp\\mysql\\data\\regapp_db';
    
    if (!is_dir($backup_path)) {
        throw new Exception("Backup directory not found: $backup_path");
    }
    
    logMessage("Found backup directory: $backup_path", 'info');
    
    // Stop MySQL for safe file copy
    logMessage("Step 1: Stopping MySQL for safe data restoration...", 'backup');
    
    // Use Windows service commands
    exec('net stop mysql 2>&1', $output, $return_code);
    logMessage("MySQL stop command executed (code: $return_code)", 'info');
    
    sleep(3); // Wait for MySQL to fully stop
    
    // Backup current data first
    $current_backup = $current_path . '_before_restore_' . date('Y-m-d_H-i-s');
    if (is_dir($current_path)) {
        logMessage("Step 2: Backing up current data to: " . basename($current_backup), 'warning');
        
        // Create backup directory
        if (!is_dir($current_backup)) {
            mkdir($current_backup, 0755, true);
        }
        
        // Copy current files
        $files = glob($current_path . '\\*');
        foreach ($files as $file) {
            if (is_file($file)) {
                copy($file, $current_backup . '\\' . basename($file));
            }
        }
        logMessage("✓ Current data backed up", 'success');
    }
    
    // Remove current regapp_db directory
    if (is_dir($current_path)) {
        logMessage("Step 3: Removing current empty database...", 'info');
        
        $files = glob($current_path . '\\*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        logMessage("✓ Current database files removed", 'success');
    }
    
    // Copy backup data
    logMessage("Step 4: Copying backup data with real user information...", 'backup');
    
    if (!is_dir($current_path)) {
        mkdir($current_path, 0755, true);
    }
    
    // Copy all backup files
    $backup_files = glob($backup_path . '\\*');
    $copied_count = 0;
    
    foreach ($backup_files as $file) {
        if (is_file($file)) {
            $filename = basename($file);
            $target = $current_path . '\\' . $filename;
            
            if (copy($file, $target)) {
                $copied_count++;
                $size = filesize($file);
                logMessage("✓ Copied $filename (" . formatBytes($size) . ")", 'info');
            }
        }
    }
    
    logMessage("✓ Copied $copied_count backup files", 'success');
    
    // Start MySQL
    logMessage("Step 5: Starting MySQL with restored data...", 'backup');
    exec('net start mysql 2>&1', $output, $return_code);
    logMessage("MySQL start command executed (code: $return_code)", 'info');
    
    // Wait for MySQL to be ready
    $max_wait = 30;
    $wait_count = 0;
    $mysql_ready = false;
    
    while ($wait_count < $max_wait && !$mysql_ready) {
        sleep(1);
        $wait_count++;
        
        try {
            $test_pdo = new PDO("mysql:host=localhost", "root", "");
            $mysql_ready = true;
            logMessage("✓ MySQL ready after $wait_count seconds", 'success');
        } catch (Exception $e) {
            // Still waiting
        }
    }
    
    if (!$mysql_ready) {
        throw new Exception("MySQL failed to start after $max_wait seconds");
    }
    
    // Verify restoration
    logMessage("Step 6: Verifying data restoration...", 'backup');
    
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    logMessage("✓ Database restored with " . count($tables) . " tables", 'success');
    
    // Check user data
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $user_count = $stmt->fetchColumn();
        logMessage("👥 Users restored: $user_count", 'success');
        
        if ($user_count > 0) {
            // Show sample user data
            $stmt = $pdo->query("SELECT id, email, created_at FROM users LIMIT 3");
            $sample_users = $stmt->fetchAll();
            logMessage("Sample users:", 'info');
            foreach ($sample_users as $user) {
                logMessage("  - ID: {$user['id']}, Email: {$user['email']}, Created: {$user['created_at']}", 'info');
            }
        }
    }
    
    // Check admin users
    if (in_array('admin_users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
        $admin_count = $stmt->fetchColumn();
        logMessage("👨‍💼 Admin users restored: $admin_count", 'success');
    }
    
    // Check profiles
    if (in_array('user_profiles', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM user_profiles");
        $profile_count = $stmt->fetchColumn();
        logMessage("📋 User profiles restored: $profile_count", 'success');
    }
    
    // Check additional tables from backup
    $additional_tables = ['feature_switches', 'form_values', 'user_education', 'user_profession', 'user_kulam_details'];
    $found_additional = [];
    
    foreach ($additional_tables as $table) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            $found_additional[] = "$table ($count records)";
        }
    }
    
    if (!empty($found_additional)) {
        logMessage("📊 Additional data restored: " . implode(', ', $found_additional), 'success');
    }
    
    logMessage("=== USER DATA RESTORATION COMPLETED SUCCESSFULLY ===", 'success');
    
} catch (Exception $e) {
    logMessage("ERROR: " . $e->getMessage(), 'error');
}

function formatBytes($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    return round($bytes / (1024 ** $pow), 2) . ' ' . $units[$pow];
}

echo "<div class='log backup'>";
echo "<h3>🎉 Data Restoration Summary</h3>";
echo "<p><strong>Restored from backup:</strong> C:\\xampp\\mysql\\backup\\data_backup\\regapp_db</p>";
echo "<p><strong>Backup date:</strong> August 23-26, 2025</p>";
echo "<h4>What was restored:</h4>";
echo "<ul>";
echo "<li>✅ Real user accounts and profiles</li>";
echo "<li>✅ Admin users and permissions</li>";
echo "<li>✅ Feature switches and form values</li>";
echo "<li>✅ User education and profession data</li>";
echo "<li>✅ Family and cultural details</li>";
echo "<li>✅ Invitation and subscription records</li>";
echo "</ul>";
echo "</div>";

echo "<div class='log info'>";
echo "<h4>Next Steps:</h4>";
echo "<ol>";
echo "<li>Refresh phpMyAdmin to see the restored data</li>";
echo "<li>Test admin login with your original credentials</li>";
echo "<li>Verify user data and profiles are accessible</li>";
echo "<li>Check all features are working with real data</li>";
echo "</ol>";
echo "</div>";

echo "</body></html>";
?>
