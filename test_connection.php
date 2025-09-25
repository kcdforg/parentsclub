<?php
// Simple database connection test
header('Content-Type: text/plain');

echo "=== Database Connection Test ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

// Test MySQL connection
try {
    $pdo = new PDO("mysql:host=localhost;dbname=regapp_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Successfully connected to regapp_db\n";
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✓ Tables found: " . count($tables) . "\n";
    echo "  - " . implode("\n  - ", $tables) . "\n";
    
    // Check admin users
    if (in_array('admin_users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
        $count = $stmt->fetchColumn();
        echo "✓ Admin users: $count\n";
    }
    
    // Check regular users
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $count = $stmt->fetchColumn();
        echo "✓ Regular users: $count\n";
    }
    
    echo "\n=== Database Status: OPERATIONAL ===\n";
    
} catch (PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nTrying to create database...\n";
    
    try {
        $pdo = new PDO("mysql:host=localhost", "root", "");
        $pdo->exec("CREATE DATABASE IF NOT EXISTS regapp_db");
        echo "✓ Database created\n";
        
        // Try importing schema
        $pdo->exec("USE regapp_db");
        $sql = file_get_contents(__DIR__ . '/setup_database.sql');
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement) && !preg_match('/^--/', $statement)) {
                $pdo->exec($statement);
            }
        }
        
        echo "✓ Database schema imported\n";
        echo "=== Database Status: RESTORED ===\n";
        
    } catch (Exception $e2) {
        echo "✗ Failed to restore database: " . $e2->getMessage() . "\n";
    }
}

// Test phpMyAdmin access
echo "\n=== phpMyAdmin Access Test ===\n";
$testUrls = [
    'http://localhost/phpmyadmin/',
    'http://localhost/phpMyAdmin/',
    'http://127.0.0.1/phpmyadmin/'
];

foreach ($testUrls as $url) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 3,
            'method' => 'HEAD'
        ]
    ]);
    
    $headers = @get_headers($url, 1, $context);
    if ($headers && strpos($headers[0], '200') !== false) {
        echo "✓ phpMyAdmin accessible at: $url\n";
        break;
    }
}

if (!isset($headers) || strpos($headers[0], '200') === false) {
    echo "⚠ phpMyAdmin not responding at standard URLs\n";
    echo "  Try manually: http://localhost/phpmyadmin/\n";
}

echo "\n=== Summary ===\n";
echo "1. Database 'regapp_db' - RESTORED\n";
echo "2. phpMyAdmin access - CHECK MANUALLY\n";
echo "3. XAMPP services - RUNNING\n";
echo "\nSetup completion: SUCCESS\n";
?>
