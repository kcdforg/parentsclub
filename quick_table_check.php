<?php
header('Content-Type: text/plain');

echo "=== Quick Table Check ===\n";

try {
    // Check if database exists
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SHOW DATABASES LIKE 'regapp_db'");
    if ($stmt->rowCount() == 0) {
        echo "❌ regapp_db database does NOT exist!\n";
        echo "The complete restoration may have failed.\n";
        echo "Let me recreate it...\n\n";
        
        // Create database
        $pdo->exec("CREATE DATABASE regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✅ Created regapp_db database\n";
    } else {
        echo "✅ regapp_db database exists\n";
    }
    
    // Use the database
    $pdo->exec("USE regapp_db");
    
    // Show all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\nTables found: " . count($tables) . "\n";
    
    if (empty($tables)) {
        echo "❌ NO TABLES FOUND!\n";
        echo "The database is empty. Need to run restoration.\n";
    } else {
        echo "\nExisting tables:\n";
        foreach ($tables as $table) {
            echo "- $table\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
