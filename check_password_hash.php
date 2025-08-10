<?php
// Check current password hash and test verification
require_once 'config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful!\n\n";
    
    // Check admin user
    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "Admin user found:\n";
        echo "Username: " . $admin['username'] . "\n";
        echo "Password Hash: " . $admin['password'] . "\n";
        echo "Is Active: " . ($admin['is_active'] ? 'Yes' : 'No') . "\n\n";
        
        // Check hash info
        $hashInfo = password_get_info($admin['password']);
        echo "Hash Info:\n";
        echo "Algorithm: " . $hashInfo['algoName'] . "\n";
        echo "Algorithm ID: " . $hashInfo['algo'] . "\n";
        echo "Options: " . json_encode($hashInfo['options']) . "\n\n";
        
        // Test password verification
        $testPassword = 'admin123';
        $verifyResult = password_verify($testPassword, $admin['password']);
        echo "Testing password: " . $testPassword . "\n";
        echo "Password verify result: " . ($verifyResult ? 'TRUE' : 'FALSE') . "\n\n";
        
        if (!$verifyResult) {
            echo "Password verification failed! Let's generate a new hash...\n";
            $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
            echo "New hash for 'admin123': " . $newHash . "\n";
            
            // Update the password
            $updateStmt = $db->prepare("UPDATE admin_users SET password = ? WHERE username = 'admin'");
            $updateStmt->execute([$newHash]);
            
            if ($updateStmt->rowCount() > 0) {
                echo "Password updated successfully!\n";
                
                // Test again
                $newVerifyResult = password_verify($testPassword, $newHash);
                echo "New password verification result: " . ($newVerifyResult ? 'TRUE' : 'FALSE') . "\n";
            }
        }
        
    } else {
        echo "Admin user not found!\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 