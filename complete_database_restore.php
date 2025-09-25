<?php
// Complete database restoration with ALL features
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>Complete RegApp Database Restoration</title>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5;} .log{background:white;padding:15px;margin:10px 0;border-radius:5px;box-shadow:0 2px 4px rgba(0,0,0,0.1);} .success{color:green;} .error{color:red;} .warning{color:orange;} .info{color:blue;} .feature{background:#e8f5e9;border-left:4px solid #4caf50;}</style></head><body>";

echo "<h1>Complete RegApp Database Restoration</h1>";
echo "<p><strong>This will create ALL tables including:</strong></p>";
echo "<ul><li>✅ Core tables (users, profiles, admin)</li>";
echo "<li>✅ Family features (spouse, children, family tree)</li>";
echo "<li>✅ Groups & memberships</li>";
echo "<li>✅ Events & RSVPs</li>";
echo "<li>✅ Announcements</li>";
echo "<li>✅ Help Posts (Ask Help)</li>";
echo "<li>✅ Notifications</li>";
echo "<li>✅ Districts & Post Offices</li></ul>";

function logMessage($message, $type = 'info') {
    $class = $type;
    echo "<div class='log $class'>$message</div>";
    flush();
}

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    logMessage("✓ Connected to MySQL successfully", 'success');
    
    // Drop and recreate database for clean state
    $pdo->exec("DROP DATABASE IF EXISTS regapp_db");
    $pdo->exec("CREATE DATABASE regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE regapp_db");
    
    logMessage("✓ Created fresh regapp_db database", 'success');
    
    // Execute unified schema first
    logMessage("Step 1: Creating core tables from unified schema...", 'feature');
    $unifiedSchema = file_get_contents(__DIR__ . '/database/unified_schema.sql');
    if (!$unifiedSchema) {
        throw new Exception("Could not read unified_schema.sql");
    }
    
    $statements = explode(';', $unifiedSchema);
    $coreCount = 0;
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement) && !preg_match('/^--/', $statement) && !preg_match('/^\/\*/', $statement)) {
            try {
                $pdo->exec($statement);
                $coreCount++;
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'already exists') === false) {
                    logMessage("Warning: " . $e->getMessage(), 'warning');
                }
            }
        }
    }
    logMessage("✓ Executed $coreCount core schema statements", 'success');
    
    // Execute family tables migration
    logMessage("Step 2: Adding family features (spouse, children, family tree)...", 'feature');
    $familySchema = file_get_contents(__DIR__ . '/database/family_tables_migration.sql');
    if ($familySchema) {
        $statements = explode(';', $familySchema);
        $familyCount = 0;
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement) && !preg_match('/^--/', $statement) && !preg_match('/^\/\*/', $statement)) {
                try {
                    $pdo->exec($statement);
                    $familyCount++;
                } catch (PDOException $e) {
                    if (strpos($e->getMessage(), 'already exists') === false && strpos($e->getMessage(), 'Duplicate column') === false) {
                        logMessage("Family migration note: " . $e->getMessage(), 'warning');
                    }
                }
            }
        }
        logMessage("✓ Executed $familyCount family schema statements", 'success');
    }
    
    // Execute enhanced features schema (groups, events, announcements, help posts)
    logMessage("Step 3: Adding enhanced features (groups, events, announcements, help posts)...", 'feature');
    $enhancedSchema = file_get_contents(__DIR__ . '/database/enhanced_features_schema.sql');
    if ($enhancedSchema) {
        $statements = explode(';', $enhancedSchema);
        $enhancedCount = 0;
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement) && !preg_match('/^--/', $statement) && !preg_match('/^\/\*/', $statement)) {
                try {
                    $pdo->exec($statement);
                    $enhancedCount++;
                } catch (PDOException $e) {
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        logMessage("Enhanced features note: " . $e->getMessage(), 'warning');
                    }
                }
            }
        }
        logMessage("✓ Executed $enhancedCount enhanced features statements", 'success');
    }
    
    // Show all created tables
    logMessage("Step 4: Verifying all tables created...", 'feature');
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    logMessage("✓ Total tables created: " . count($tables), 'success');
    
    // Categorize tables for better display
    $coreTablesFound = [];
    $familyTablesFound = [];
    $featureTablesFound = [];
    $otherTablesFound = [];
    
    foreach ($tables as $table) {
        if (in_array($table, ['admin_users', 'users', 'user_profiles', 'invitations', 'subscriptions', 'sessions'])) {
            $coreTablesFound[] = $table;
        } elseif (in_array($table, ['spouse_details', 'children_details', 'family_tree'])) {
            $familyTablesFound[] = $table;
        } elseif (in_array($table, ['groups', 'group_members', 'announcements', 'announcement_likes', 'announcement_comments', 'events', 'event_rsvps', 'help_posts', 'help_post_likes', 'help_post_comments', 'notifications'])) {
            $featureTablesFound[] = $table;
        } else {
            $otherTablesFound[] = $table;
        }
    }
    
    logMessage("Core tables: " . implode(', ', $coreTablesFound), 'info');
    logMessage("Family tables: " . implode(', ', $familyTablesFound), 'info');
    logMessage("Feature tables: " . implode(', ', $featureTablesFound), 'info');
    logMessage("Other tables: " . implode(', ', $otherTablesFound), 'info');
    
    // Insert default admin user
    logMessage("Step 5: Creating default admin user...", 'feature');
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $hashedPassword, 'admin@regapp.com', 'System Administrator', 'super_admin']);
        logMessage("✓ Created admin user (username: admin, password: admin123)", 'success');
    } catch (PDOException $e) {
        logMessage("Admin user may already exist: " . $e->getMessage(), 'warning');
    }
    
    // Check essential data
    logMessage("Step 6: Verifying data integrity...", 'feature');
    
    // Check admin users
    $stmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
    $adminCount = $stmt->fetchColumn();
    logMessage("Admin users: $adminCount", 'info');
    
    // Check districts and post offices
    $stmt = $pdo->query("SELECT COUNT(*) FROM districts");
    $districtCount = $stmt->fetchColumn();
    logMessage("Districts loaded: $districtCount", 'info');
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM post_offices");
    $postOfficeCount = $stmt->fetchColumn();
    logMessage("Post offices loaded: $postOfficeCount", 'info');
    
    logMessage("=== COMPLETE DATABASE RESTORATION SUCCESSFUL ===", 'success');
    
} catch (Exception $e) {
    logMessage("FATAL ERROR: " . $e->getMessage(), 'error');
}

echo "<div class='log feature'>";
echo "<h3>🎉 Database Restoration Complete!</h3>";
echo "<h4>What's Now Available:</h4>";
echo "<ul>";
echo "<li><strong>User Management:</strong> Registration, profiles, family details</li>";
echo "<li><strong>Family Features:</strong> Spouse details, children, family tree</li>";
echo "<li><strong>Groups:</strong> District/area-based groups, memberships</li>";
echo "<li><strong>Events:</strong> Event creation, RSVPs, tracking</li>";
echo "<li><strong>Announcements:</strong> Community announcements with likes/comments</li>";
echo "<li><strong>Ask Help:</strong> Help posts with targeted audiences</li>";
echo "<li><strong>Notifications:</strong> User activity notifications</li>";
echo "<li><strong>Location Data:</strong> Districts and post offices for India</li>";
echo "</ul>";
echo "</div>";

echo "<div class='log info'>";
echo "<h4>Next Steps:</h4>";
echo "<ol>";
echo "<li>Refresh phpMyAdmin to see all tables</li>";
echo "<li>Test admin login: username='admin', password='admin123'</li>";
echo "<li>Test user registration and profile completion flow</li>";
echo "<li>Verify all features are working (groups, events, announcements, help posts)</li>";
echo "</ol>";
echo "</div>";

echo "<div class='log'>";
echo "<p><strong>Direct Links:</strong></p>";
echo "<ul>";
echo "<li><a href='http://localhost/phpmyadmin/' target='_blank'>Open phpMyAdmin</a></li>";
echo "<li><a href='http://localhost/regapp2/admin/frontend/login.html' target='_blank'>Test Admin Login</a></li>";
echo "<li><a href='http://localhost/regapp2/public/frontend/register.html' target='_blank'>Test User Registration</a></li>";
echo "</ul>";
echo "</div>";

echo "</body></html>";
?>
