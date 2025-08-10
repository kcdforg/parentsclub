<?php
// Fix admin password
require_once 'config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Generate correct hash for admin123
    $password = 'admin123';
    $correctHash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "Fixing admin password...\n";
    echo "New password: " . $password . "\n";
    echo "New hash: " . $correctHash . "\n\n";
    
    // Update admin password
    $stmt = $db->prepare("UPDATE admin_users SET password = ? WHERE username = 'admin'");
    $stmt->execute([$correctHash]);
    
    if ($stmt->rowCount() > 0) {
        echo "✓ Admin password updated successfully!\n";
        echo "You can now login with:\n";
        echo "Username: admin\n";
        echo "Password: admin123\n";
    } else {
        echo "✗ Admin user not found or password already updated.\n";
        
        // Check if admin user exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM admin_users WHERE username = 'admin'");
        $stmt->execute();
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            echo "Admin user doesn't exist. Creating one...\n";
            
            $stmt = $db->prepare("INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)");
            $stmt->execute(['admin', $correctHash, 'admin@example.com']);
            
            echo "✓ Admin user created successfully!\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?> 