<?php
header('Content-Type: text/plain');

echo "=== Data Restoration Verification ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to regapp_db successfully\n\n";
    
    // Check all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "=== Database Tables Analysis ===\n";
    echo "Total tables found: " . count($tables) . "\n\n";
    
    // Core tables with data counts
    $core_tables = [
        'admin_users' => 'Admin Users',
        'users' => 'Regular Users', 
        'user_profiles' => 'User Profiles',
        'invitations' => 'Invitations',
        'subscriptions' => 'Subscriptions'
    ];
    
    echo "=== CORE DATA TABLES ===\n";
    foreach ($core_tables as $table => $description) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                echo "✅ $description: $count records\n";
                
                // Show sample data for key tables
                if ($table === 'users' && $count > 0) {
                    $stmt = $pdo->query("SELECT email, created_at FROM users ORDER BY id LIMIT 3");
                    $samples = $stmt->fetchAll();
                    foreach ($samples as $sample) {
                        echo "   - {$sample['email']} (created: {$sample['created_at']})\n";
                    }
                } elseif ($table === 'admin_users' && $count > 0) {
                    $stmt = $pdo->query("SELECT username, email FROM admin_users LIMIT 3");
                    $samples = $stmt->fetchAll();
                    foreach ($samples as $sample) {
                        echo "   - {$sample['username']} ({$sample['email']})\n";
                    }
                }
            } else {
                echo "⚠️  $description: 0 records (empty)\n";
            }
        } else {
            echo "❌ $description: Table missing\n";
        }
    }
    
    // Extended tables from backup
    $extended_tables = [
        'feature_switches' => 'Feature Switches',
        'form_values' => 'Form Values',
        'user_education' => 'User Education',
        'user_profession' => 'User Profession',
        'user_kulam_details' => 'Kulam Details',
        'user_family_additional_details' => 'Family Additional Details'
    ];
    
    echo "\n=== EXTENDED FEATURES ===\n";
    $extended_found = 0;
    foreach ($extended_tables as $table => $description) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            echo "✅ $description: $count records\n";
            $extended_found++;
        } else {
            echo "❌ $description: Not found\n";
        }
    }
    
    // Family features
    $family_tables = [
        'spouse_details' => 'Spouse Details',
        'children_details' => 'Children Details', 
        'family_tree' => 'Family Tree'
    ];
    
    echo "\n=== FAMILY FEATURES ===\n";
    foreach ($family_tables as $table => $description) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            echo "✅ $description: $count records\n";
        } else {
            echo "❌ $description: Not found\n";
        }
    }
    
    // Community features
    $community_tables = [
        'groups' => 'Groups',
        'group_members' => 'Group Members',
        'events' => 'Events',
        'announcements' => 'Announcements',
        'help_posts' => 'Help Posts',
        'notifications' => 'Notifications'
    ];
    
    echo "\n=== COMMUNITY FEATURES ===\n";
    foreach ($community_tables as $table => $description) {
        if (in_array($table, $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
            $count = $stmt->fetchColumn();
            echo "✅ $description: $count records\n";
        } else {
            echo "❌ $description: Not found\n";
        }
    }
    
    // Summary
    echo "\n=== RESTORATION STATUS ===\n";
    
    $user_count = 0;
    $profile_count = 0;
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $user_count = $stmt->fetchColumn();
    }
    if (in_array('user_profiles', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM user_profiles");  
        $profile_count = $stmt->fetchColumn();
    }
    
    if ($user_count > 0 && $profile_count > 0) {
        echo "🎉 RESTORATION SUCCESSFUL!\n";
        echo "✅ Real user data has been restored\n";
        echo "✅ $user_count users with $profile_count profiles\n";
        if ($extended_found > 0) {
            echo "✅ $extended_found extended feature tables restored\n";
        }
        echo "\n📝 Next Steps:\n";
        echo "1. Refresh phpMyAdmin to see all data\n";
        echo "2. Test admin login with restored credentials\n";
        echo "3. Verify user profiles and features work\n";
        echo "4. Check extended features like form values\n";
    } else {
        echo "⚠️  Restoration may be incomplete\n";
        echo "User count: $user_count\n";
        echo "Profile count: $profile_count\n";
        echo "Check the restoration script output for errors\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Database may still be restoring or MySQL may be restarting\n";
    echo "Wait a moment and try again\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Verification completed at " . date('Y-m-d H:i:s') . "\n";
?>
