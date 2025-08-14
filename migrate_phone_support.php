<?php
/**
 * Database Migration Script for Phone Support
 * This script adds phone number support to invitations and users tables
 */

require_once 'config/database.php';

echo "<h2>Phone Support Migration Script</h2>";

try {
    $db = Database::getInstance()->getConnection();
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Check if phone column exists in users table
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'phone'");
    $phoneColumnExists = $stmt->fetch();
    
    if ($phoneColumnExists) {
        echo "<p style='color: orange;'>⚠ phone column already exists in users table</p>";
    } else {
        // Add phone column to users table
        echo "<p>Adding phone column to users table...</p>";
        $db->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(15) UNIQUE AFTER email");
        echo "<p style='color: green;'>✓ phone column added to users table</p>";
    }
    
    // Check if phone column exists in invitations table
    $stmt = $db->query("SHOW COLUMNS FROM invitations LIKE 'invited_phone'");
    $invitedPhoneColumnExists = $stmt->fetch();
    
    if ($invitedPhoneColumnExists) {
        echo "<p style='color: orange;'>⚠ invited_phone column already exists in invitations table</p>";
    } else {
        // Add invited_phone column to invitations table
        echo "<p>Adding invited_phone column to invitations table...</p>";
        $db->exec("ALTER TABLE invitations ADD COLUMN invited_phone VARCHAR(15) AFTER invited_email");
        echo "<p style='color: green;'>✓ invited_phone column added to invitations table</p>";
    }
    
    // Check if phone_verified column exists in users table
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'phone_verified'");
    $phoneVerifiedColumnExists = $stmt->fetch();
    
    if ($phoneVerifiedColumnExists) {
        echo "<p style='color: orange;'>⚠ phone_verified column already exists in users table</p>";
    } else {
        // Add phone_verified column to users table
        echo "<p>Adding phone_verified column to users table...</p>";
        $db->exec("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE AFTER email_verified");
        echo "<p style='color: green;'>✓ phone_verified column added to users table</p>";
    }
    
    // Check if phone_verification_token column exists in users table
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'phone_verification_token'");
    $phoneTokenColumnExists = $stmt->fetch();
    
    if ($phoneTokenColumnExists) {
        echo "<p style='color: orange;'>⚠ phone_verification_token column already exists in users table</p>";
    } else {
        // Add phone_verification_token column to users table
        echo "<p>Adding phone_verification_token column to users table...</p>";
        $db->exec("ALTER TABLE users ADD COLUMN phone_verification_token VARCHAR(64) AFTER email_verification_token");
        echo "<p style='color: green;'>✓ phone_verification_token column added to users table</p>";
    }
    
    // Add indexes for better performance
    echo "<p>Adding indexes...</p>";
    
    try {
        $db->exec("CREATE INDEX idx_users_phone ON users(phone)");
        echo "<p style='color: green;'>✓ users phone index created</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ users phone index may already exist: " . $e->getMessage() . "</p>";
    }
    
    try {
        $db->exec("CREATE INDEX idx_invitations_phone ON invitations(invited_phone)");
        echo "<p style='color: green;'>✓ invitations phone index created</p>";
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠ invitations phone index may already exist: " . $e->getMessage() . "</p>";
    }
    
    // Show final table structures
    echo "<h3>Users Table Structure:</h3>";
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h3>Invitations Table Structure:</h3>";
    $stmt = $db->query("DESCRIBE invitations");
    $invitationColumns = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    foreach ($invitationColumns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<p style='color: green; font-weight: bold;'>✓ Phone support migration completed successfully!</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Migration failed: " . $e->getMessage() . "</p>";
    echo "<p>Error details: " . $e->getTraceAsString() . "</p>";
}
?>
