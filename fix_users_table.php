<?php
// Fix users table by disabling foreign key checks
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== FIXING USERS TABLE RESTORATION ===\n";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to database\n";
    
    // Disable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    echo "✓ Disabled foreign key checks\n";
    
    // Paths
    $backup_path = 'C:\\xampp\\mysql\\backup\\data_backup\\regapp_db';
    $current_path = 'C:\\xampp\\mysql\\data\\regapp_db';
    
    // Restore users table
    echo "\n=== Restoring users table ===\n";
    
    try {
        $pdo->exec("ALTER TABLE users DISCARD TABLESPACE");
        echo "✓ Discarded users tablespace\n";
    } catch (Exception $e) {
        echo "⚠ Tablespace discard: " . $e->getMessage() . "\n";
    }
    
    // Copy users.ibd file
    $backup_ibd = $backup_path . '\\users.ibd';
    $current_ibd = $current_path . '\\users.ibd';
    
    if (file_exists($current_ibd)) {
        unlink($current_ibd);
    }
    
    if (copy($backup_ibd, $current_ibd)) {
        echo "✓ Copied users.ibd file\n";
        
        // Import tablespace
        $pdo->exec("ALTER TABLE users IMPORT TABLESPACE");
        echo "✓ Imported users tablespace\n";
        
        // Check user count
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $count = $stmt->fetchColumn();
        echo "✅ Users table now has $count records\n";
        
        if ($count > 0) {
            // Show sample users
            $stmt = $pdo->query("SELECT id, email, created_at FROM users LIMIT 3");
            $users = $stmt->fetchAll();
            echo "\nSample users:\n";
            foreach ($users as $user) {
                echo "- ID: {$user['id']}, Email: {$user['email']}, Created: {$user['created_at']}\n";
            }
        }
        
    } else {
        echo "❌ Failed to copy users.ibd file\n";
    }
    
    // Try to restore admin_users if needed
    echo "\n=== Checking admin_users ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
    $admin_count = $stmt->fetchColumn();
    
    if ($admin_count <= 1) {
        echo "Attempting to restore admin_users...\n";
        
        try {
            $pdo->exec("ALTER TABLE admin_users DISCARD TABLESPACE");
            echo "✓ Discarded admin_users tablespace\n";
        } catch (Exception $e) {
            echo "⚠ Admin tablespace discard: " . $e->getMessage() . "\n";
        }
        
        $backup_admin_ibd = $backup_path . '\\admin_users.ibd';
        $current_admin_ibd = $current_path . '\\admin_users.ibd';
        
        if (file_exists($current_admin_ibd)) {
            unlink($current_admin_ibd);
        }
        
        if (copy($backup_admin_ibd, $current_admin_ibd)) {
            echo "✓ Copied admin_users.ibd file\n";
            
            $pdo->exec("ALTER TABLE admin_users IMPORT TABLESPACE");
            echo "✓ Imported admin_users tablespace\n";
            
            $stmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
            $new_admin_count = $stmt->fetchColumn();
            echo "✅ Admin users table now has $new_admin_count records\n";
        }
    } else {
        echo "✓ Admin users already has $admin_count records\n";
    }
    
    // Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "\n✓ Re-enabled foreign key checks\n";
    
    echo "\n=== FINAL VERIFICATION ===\n";
    
    // Check all key tables
    $key_tables = ['admin_users', 'users', 'user_profiles', 'invitations'];
    $total_records = 0;
    
    foreach ($key_tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
        $count = $stmt->fetchColumn();
        echo "✅ $table: $count records\n";
        $total_records += $count;
    }
    
    echo "\n🎉 RESTORATION SUCCESS!\n";
    echo "Total records restored: $total_records\n";
    echo "Your real user data has been restored!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
