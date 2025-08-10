<?php
// Test database connection and admin user
require_once 'config/database.php';

try {
    echo "Testing database connection...\n";
    $db = Database::getInstance()->getConnection();
    echo "✓ Database connection successful!\n\n";
    
    // Check if admin_users table exists
    $stmt = $db->query("SHOW TABLES LIKE 'admin_users'");
    if ($stmt->rowCount() > 0) {
        echo "✓ admin_users table exists\n";
    } else {
        echo "✗ admin_users table does not exist\n";
        exit;
    }
    
    // Check admin user
    $stmt = $db->prepare("SELECT id, username, password, is_active FROM admin_users WHERE username = ?");
    $stmt->execute(['admin']);
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "✓ Admin user found:\n";
        echo "  ID: " . $admin['id'] . "\n";
        echo "  Username: " . $admin['username'] . "\n";
        echo "  Password Hash: " . $admin['password'] . "\n";
        echo "  Is Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n";
        
        // Test password verification
        $testPassword = 'admin123';
        if (password_verify($testPassword, $admin['password'])) {
            echo "✓ Password 'admin123' is valid!\n";
        } else {
            echo "✗ Password 'admin123' is NOT valid!\n";
            
            // Generate correct hash
            $correctHash = password_hash($testPassword, PASSWORD_DEFAULT);
            echo "  Correct hash for 'admin123': " . $correctHash . "\n";
        }
    } else {
        echo "✗ Admin user not found!\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?> 