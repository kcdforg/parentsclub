<?php
/**
 * Database Migration Script for User Types
 * This script safely adds the user_type column and updates existing users
 */

require_once 'config/database.php';

echo "<h2>User Type Migration Script</h2>";

try {
    $db = Database::getInstance()->getConnection();
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Check if user_type column already exists
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'user_type'");
    $columnExists = $stmt->fetch();
    
    if ($columnExists) {
        echo "<p style='color: orange;'>⚠ user_type column already exists</p>";
    } else {
        // Add user_type column
        echo "<p>Adding user_type column...</p>";
        $db->exec("ALTER TABLE users ADD COLUMN user_type ENUM('invited', 'registered', 'enrolled', 'approved', 'premium') DEFAULT 'invited' AFTER approval_status");
        echo "<p style='color: green;'>✓ user_type column added successfully</p>";
    }
    
    // Update existing users based on their current status
    echo "<p>Updating existing users...</p>";
    
    // Users with pending approval and incomplete profile = registered
    $stmt = $db->prepare("UPDATE users SET user_type = 'registered' WHERE approval_status = 'pending' AND profile_completed = FALSE");
    $stmt->execute();
    $registeredCount = $stmt->rowCount();
    echo "<p>✓ Updated $registeredCount users to 'registered' type</p>";
    
    // Users with pending approval and complete profile = enrolled
    $stmt = $db->prepare("UPDATE users SET user_type = 'enrolled' WHERE approval_status = 'pending' AND profile_completed = TRUE");
    $stmt->execute();
    $enrolledCount = $stmt->rowCount();
    echo "<p>✓ Updated $enrolledCount users to 'enrolled' type</p>";
    
    // Users with approved status = approved
    $stmt = $db->prepare("UPDATE users SET user_type = 'approved' WHERE approval_status = 'approved'");
    $stmt->execute();
    $approvedCount = $stmt->rowCount();
    echo "<p>✓ Updated $approvedCount users to 'approved' type</p>";
    
    // Users with active subscriptions = premium
    $stmt = $db->prepare("UPDATE users SET user_type = 'premium' WHERE id IN (SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active')");
    $stmt->execute();
    $premiumCount = $stmt->execute() ? $stmt->rowCount() : 0;
    echo "<p>✓ Updated $premiumCount users to 'premium' type</p>";
    
    // Add index for better performance
    echo "<p>Adding index...</p>";
    try {
        $db->exec("CREATE INDEX idx_users_user_type ON users(user_type)");
        echo "<p style='color: green;'>✓ Index created successfully</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ Index may already exist: " . $e->getMessage() . "</p>";
    }
    
    // Show final user type distribution
    echo "<h3>Final User Type Distribution:</h3>";
    $stmt = $db->query("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type ORDER BY count DESC");
    $distribution = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>User Type</th><th>Count</th></tr>";
    
    foreach ($distribution as $row) {
        echo "<tr>";
        echo "<td>{$row['user_type']}</td>";
        echo "<td>{$row['count']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<p style='color: green; font-weight: bold;'>✓ Migration completed successfully!</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Migration failed: " . $e->getMessage() . "</p>";
    echo "<p>Error details: " . $e->getTraceAsString() . "</p>";
}
?>
