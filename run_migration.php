<?php
/**
 * Database Migration Runner
 * Runs the introduction flow fix migration
 */

require_once 'config/database.php';

echo "Starting Introduction Flow Fix Migration...\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Read the migration file
    $migrationSQL = file_get_contents('database/migration_fix_intro_flow.sql');
    
    if (!$migrationSQL) {
        throw new Exception("Could not read migration file");
    }
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $migrationSQL)));
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue; // Skip empty statements and comments
        }
        
        try {
            $db->exec($statement);
            $successCount++;
            echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
        } catch (PDOException $e) {
            $errorCount++;
            echo "✗ Error: " . $e->getMessage() . "\n";
            echo "Statement: " . substr($statement, 0, 100) . "...\n";
        }
    }
    
    echo "\n=== Migration Summary ===\n";
    echo "Successful statements: $successCount\n";
    echo "Failed statements: $errorCount\n";
    
    if ($errorCount === 0) {
        echo "🎉 Migration completed successfully!\n";
    } else {
        echo "⚠️  Migration completed with some errors. Please review the output above.\n";
    }
    
    // Verify key columns exist
    echo "\n=== Verification ===\n";
    
    try {
        $result = $db->query("DESCRIBE users");
        $userColumns = $result->fetchAll(PDO::FETCH_COLUMN);
        
        $requiredUserColumns = ['created_via_invitation', 'invitation_id'];
        foreach ($requiredUserColumns as $col) {
            if (in_array($col, $userColumns)) {
                echo "✓ users.$col exists\n";
            } else {
                echo "✗ users.$col missing\n";
            }
        }
        
        $result = $db->query("DESCRIBE user_profiles");
        $profileColumns = $result->fetchAll(PDO::FETCH_COLUMN);
        
        $requiredProfileColumns = ['intro_completed', 'questions_completed', 'profile_completion_step', 'gender', 'marriageType'];
        foreach ($requiredProfileColumns as $col) {
            if (in_array($col, $profileColumns)) {
                echo "✓ user_profiles.$col exists\n";
            } else {
                echo "✗ user_profiles.$col missing\n";
            }
        }
        
    } catch (Exception $e) {
        echo "Error during verification: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Next Steps ===\n";
echo "1. Test registration with invitation link\n";
echo "2. Test login flow for invitation-based users\n";
echo "3. Verify introduction questions flow\n";
echo "4. Test profile completion flow\n";
echo "5. Check dashboard access after completion\n";
?>
