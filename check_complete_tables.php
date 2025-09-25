<?php
header('Content-Type: text/plain');

echo "=== Complete Database Tables Check ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to regapp_db\n\n";
    
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Total Tables Found: " . count($tables) . "\n\n";
    
    // Expected tables with categories
    $expectedTables = [
        'Core Tables' => [
            'admin_users', 'users', 'user_profiles', 'invitations', 
            'subscriptions', 'sessions', 'admin_sessions', 'user_sessions'
        ],
        'Family Features' => [
            'spouse_details', 'children_details', 'family_tree'
        ],
        'Groups & Memberships' => [
            'groups', 'group_members'
        ],
        'Events' => [
            'events', 'event_rsvps', 'event_views'
        ],
        'Announcements' => [
            'announcements', 'announcement_likes', 'announcement_comments', 'announcement_views'
        ],
        'Help Posts (Ask Help)' => [
            'help_posts', 'help_post_likes', 'help_post_comments', 'help_post_views'
        ],
        'Location Data' => [
            'districts', 'post_offices'
        ],
        'System Features' => [
            'notifications', 'files', 'admin_activity_log'
        ]
    ];
    
    $allMissing = [];
    
    foreach ($expectedTables as $category => $expectedInCategory) {
        echo "=== $category ===\n";
        $missing = [];
        
        foreach ($expectedInCategory as $expectedTable) {
            if (in_array($expectedTable, $tables)) {
                // Check row count
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$expectedTable`");
                    $count = $stmt->fetchColumn();
                    echo "✓ $expectedTable ($count rows)\n";
                } catch (Exception $e) {
                    echo "✓ $expectedTable (error counting: " . $e->getMessage() . ")\n";
                }
            } else {
                echo "✗ $expectedTable - MISSING\n";
                $missing[] = $expectedTable;
                $allMissing[] = $expectedTable;
            }
        }
        
        if (empty($missing)) {
            echo "✅ All tables in $category are present\n";
        } else {
            echo "⚠ Missing " . count($missing) . " tables in $category\n";
        }
        echo "\n";
    }
    
    // Show extra tables not in our expected list
    $allExpected = [];
    foreach ($expectedTables as $category => $expectedInCategory) {
        $allExpected = array_merge($allExpected, $expectedInCategory);
    }
    
    $extraTables = array_diff($tables, $allExpected);
    if (!empty($extraTables)) {
        echo "=== Additional Tables Found ===\n";
        foreach ($extraTables as $extraTable) {
            echo "? $extraTable\n";
        }
        echo "\n";
    }
    
    // Summary
    echo "=== SUMMARY ===\n";
    echo "Expected tables: " . count($allExpected) . "\n";
    echo "Found tables: " . count($tables) . "\n";
    echo "Missing tables: " . count($allMissing) . "\n";
    
    if (empty($allMissing)) {
        echo "\n🎉 ALL EXPECTED TABLES ARE PRESENT!\n";
        echo "The complete database restoration was successful.\n";
        echo "All features should be working:\n";
        echo "- ✓ User registration and profile completion\n";
        echo "- ✓ Family details (spouse, children, family tree)\n";
        echo "- ✓ Groups and memberships\n";
        echo "- ✓ Events and RSVPs\n";
        echo "- ✓ Announcements\n";
        echo "- ✓ Help posts (Ask Help)\n";
        echo "- ✓ Notifications\n";
        echo "- ✓ Location data (districts, post offices)\n";
    } else {
        echo "\n⚠ MISSING TABLES:\n";
        foreach ($allMissing as $missing) {
            echo "- $missing\n";
        }
        echo "\nYou may need to run additional migration scripts.\n";
    }
    
    // Check admin user
    if (in_array('admin_users', $tables)) {
        echo "\n=== Admin User Check ===\n";
        $stmt = $pdo->query("SELECT username, email, role FROM admin_users");
        $admins = $stmt->fetchAll();
        
        if (!empty($admins)) {
            foreach ($admins as $admin) {
                echo "Admin: {$admin['username']} ({$admin['email']}) - Role: {$admin['role']}\n";
            }
        } else {
            echo "⚠ No admin users found\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Check completed at " . date('Y-m-d H:i:s') . "\n";
?>
