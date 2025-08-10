<?php
// Update admin password to use MD5 hashing
require_once 'config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful!\n\n";
    
    // Generate MD5 hash for admin123
    $password = 'admin123';
    $md5Hash = md5($password);
    
    echo "Password: " . $password . "\n";
    echo "MD5 Hash: " . $md5Hash . "\n\n";
    
    // Check if admin user exists
    $stmt = $db->prepare("SELECT COUNT(*) FROM admin_users WHERE username = 'admin'");
    $stmt->execute();
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        // Update existing admin password
        $updateStmt = $db->prepare("UPDATE admin_users SET password = ? WHERE username = 'admin'");
        $updateStmt->execute([$md5Hash]);
        
        if ($updateStmt->rowCount() > 0) {
            echo "✓ Admin password updated to MD5 successfully!\n";
        } else {
            echo "✗ Password update failed or no changes made.\n";
        }
    } else {
        // Create admin user if it doesn't exist
        $insertStmt = $db->prepare("INSERT INTO admin_users (username, password, email, is_active) VALUES (?, ?, ?, ?)");
        $insertStmt->execute(['admin', $md5Hash, 'admin@example.com', 1]);
        
        if ($insertStmt->rowCount() > 0) {
            echo "✓ Admin user created with MD5 password successfully!\n";
        } else {
            echo "✗ Admin user creation failed.\n";
        }
    }
    
    // Verify the update
    $verifyStmt = $db->prepare("SELECT * FROM admin_users WHERE username = 'admin'");
    $verifyStmt->execute();
    $admin = $verifyStmt->fetch();
    
    if ($admin) {
        echo "\nVerification:\n";
        echo "Username: " . $admin['username'] . "\n";
        echo "Password Hash: " . $admin['password'] . "\n";
        echo "Is Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n";
        
        // Test MD5 verification
        $testResult = (md5($password) === $admin['password']);
        echo "MD5 verification test: " . ($testResult ? 'PASSED' : 'FAILED') . "\n";
        
        if ($testResult) {
            echo "\n✅ SUCCESS! You can now login with:\n";
            echo "Username: admin\n";
            echo "Password: admin123\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 