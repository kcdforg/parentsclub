<?php
/**
 * Web-Based MySQL Fix Tool for XAMPP
 * Run this directly in your browser to fix MySQL issues
 */

// Set execution time and memory limits
set_time_limit(300);
ini_set('memory_limit', '256M');

// Function to execute system commands safely
function executeCommand($command, $description) {
    echo "<div style='background:#f0f0f0; padding:10px; margin:5px 0; border-left:4px solid #007cba;'>";
    echo "<strong>$description</strong><br>";
    echo "<code>$command</code><br>";
    
    $output = [];
    $return_var = 0;
    
    // Execute command
    exec($command . ' 2>&1', $output, $return_var);
    
    if ($return_var === 0) {
        echo "<span style='color:green'>✓ Success</span><br>";
    } else {
        echo "<span style='color:red'>✗ Failed (Exit code: $return_var)</span><br>";
    }
    
    if (!empty($output)) {
        echo "<pre style='background:#fff; padding:10px; max-height:200px; overflow-y:auto;'>";
        echo htmlspecialchars(implode("\n", $output));
        echo "</pre>";
    }
    
    echo "</div>";
    flush();
    ob_flush();
    
    return $return_var === 0;
}

// Function to test MySQL connection
function testMysqlConnection($host = 'localhost', $port = 3306, $timeout = 5) {
    $connection = @fsockopen($host, $port, $errno, $errstr, $timeout);
    if ($connection) {
        fclose($connection);
        return true;
    }
    return false;
}

// Start output buffering
ob_start();
?>
<!DOCTYPE html>
<html>
<head>
    <title>XAMPP MySQL Fix Tool</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        h1, h2 { color: #333; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .progress { background: #e9ecef; height: 20px; border-radius: 10px; margin: 10px 0; }
        .progress-bar { background: #007cba; height: 100%; border-radius: 10px; transition: width 0.3s; }
        .navigation { margin: 20px 0; text-align: center; }
        .nav-btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; margin: 5px; display: inline-block; }
        .nav-btn:hover { background: #0056b3; }
    </style>
    <script>
        function updateProgress(percent) {
            document.getElementById('progressBar').style.width = percent + '%';
            document.getElementById('progressText').innerText = percent + '%';
        }
    </script>
</head>
<body>
    <div class="container">
        <h1>XAMPP MySQL Automated Fix Tool</h1>
        <div class="info">
            <strong>This tool will automatically fix MySQL issues in XAMPP without requiring any user interaction.</strong>
        </div>
        
        <div class="navigation">
            <a href="launcher.html" class="nav-btn">🏠 Back to Launcher</a>
            <a href="restore_database.php" class="nav-btn">🔄 Restore Database</a>
        </div>
        
        <div class="progress">
            <div id="progressBar" class="progress-bar" style="width: 0%"></div>
        </div>
        <div style="text-align: center; margin: 10px 0;">
            Progress: <span id="progressText">0%</span>
        </div>

<?php
flush();
ob_flush();

$xampp_path = 'C:\\xampp';
$mysql_bin = $xampp_path . '\\mysql\\bin';
$success = true;
$step = 0;
$total_steps = 8;

// Step 1: Initial diagnosis
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Initial System Diagnosis</h2>";
echo "<div class='info'>Checking current MySQL status and system configuration...</div>";

// Check if MySQL is running
$mysql_running = testMysqlConnection();
echo "<p><strong>MySQL Status:</strong> " . ($mysql_running ? "<span style='color:green'>Running</span>" : "<span style='color:red'>Not Running</span>") . "</p>";

// Check PHP extensions
echo "<p><strong>PHP Extensions:</strong></p>";
echo "<ul>";
echo "<li>PDO: " . (extension_loaded('pdo') ? "✓" : "✗") . "</li>";
echo "<li>PDO MySQL: " . (extension_loaded('pdo_mysql') ? "✓" : "✗") . "</li>";
echo "<li>MySQLi: " . (extension_loaded('mysqli') ? "✓" : "✗") . "</li>";
echo "</ul>";

flush();
ob_flush();

// Step 2: Stop existing MySQL processes
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Stopping Existing MySQL Processes</h2>";
executeCommand('taskkill /f /im mysqld.exe', 'Killing mysqld.exe processes');
executeCommand('taskkill /f /im mysql.exe', 'Killing mysql.exe processes');

// Wait a moment
sleep(2);
flush();
ob_flush();

// Step 3: Check and fix data directory
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Preparing MySQL Data Directory</h2>";

$data_dir = $xampp_path . '\\mysql\\data';
$backup_dir = $xampp_path . '\\mysql\\data_backup_' . date('Y-m-d_H-i-s');

if (is_dir($data_dir)) {
    echo "<p>Moving existing corrupted data to backup location...</p>";
    if (rename($data_dir, $backup_dir)) {
        echo "<div class='success'>✓ Data backed up to: $backup_dir</div>";
    } else {
        echo "<div class='error'>✗ Failed to backup data directory</div>";
    }
}

// Create new data directory
if (!is_dir($data_dir)) {
    if (mkdir($data_dir, 0755, true)) {
        echo "<div class='success'>✓ Created new data directory: $data_dir</div>";
    } else {
        echo "<div class='error'>✗ Failed to create data directory</div>";
        $success = false;
    }
}

flush();
ob_flush();

// Step 4: Initialize MySQL database
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Initializing MySQL Database</h2>";

$init_success = executeCommand(
    "\"$mysql_bin\\mysql_install_db.exe\" --datadir=\"$data_dir\" --service=mysql",
    'Initializing MariaDB database system'
);

if (!$init_success) {
    echo "<div class='warning'>Trying alternative initialization method...</div>";
    $init_success = executeCommand(
        "\"$mysql_bin\\mysql_install_db.exe\" --datadir=\"$data_dir\"",
        'Alternative MariaDB initialization'
    );
}

flush();
ob_flush();

// Step 5: Start MySQL server
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Starting MySQL Server</h2>";

// Start MySQL using mysqld directly
$mysql_cmd = "\"$mysql_bin\\mysqld.exe\" --defaults-file=\"$mysql_bin\\my.ini\" --standalone --console";

echo "<p>Starting MySQL server process...</p>";

// Start the process in background using popen
$process = popen($mysql_cmd . ' 2>&1', 'r');

if ($process) {
    echo "<div class='success'>✓ MySQL process started</div>";
    
    // Wait for MySQL to be ready
    echo "<p>Waiting for MySQL to be ready...</p>";
    $max_wait = 30;
    $wait_count = 0;
    $mysql_ready = false;
    
    while ($wait_count < $max_wait && !$mysql_ready) {
        sleep(1);
        $wait_count++;
        
        if (testMysqlConnection()) {
            $mysql_ready = true;
            echo "<div class='success'>✓ MySQL is ready after $wait_count seconds</div>";
        } else {
            echo "<span style='color:#666;'>Waiting... ({$wait_count}s)</span><br>";
            flush();
            ob_flush();
        }
    }
    
    if (!$mysql_ready) {
        echo "<div class='error'>✗ MySQL failed to start within $max_wait seconds</div>";
        $success = false;
    }
    
    // Don't close the process - let it run
} else {
    echo "<div class='error'>✗ Failed to start MySQL process</div>";
    $success = false;
}

flush();
ob_flush();

// Step 6: Test database connection
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Testing Database Connection</h2>";

if ($success && testMysqlConnection()) {
    try {
        $dsn = "mysql:host=localhost;port=3306;charset=utf8mb4";
        $pdo = new PDO($dsn, 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10
        ]);
        
        echo "<div class='success'>✓ Successfully connected to MySQL server</div>";
        
        // Get MySQL version
        $version = $pdo->query('SELECT VERSION()')->fetchColumn();
        echo "<p><strong>Database Version:</strong> $version</p>";
        
        // Create regapp_db database
        echo "<p>Creating regapp_db database...</p>";
        $pdo->exec("CREATE DATABASE IF NOT EXISTS regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "<div class='success'>✓ Database regapp_db created/verified</div>";
        
    } catch (Exception $e) {
        echo "<div class='error'>✗ Database connection failed: " . $e->getMessage() . "</div>";
        $success = false;
    }
}

flush();
ob_flush();

// Step 7: Test application configuration
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Testing Application Configuration</h2>";

if ($success) {
    try {
        // Test connection to regapp_db
        $dsn_db = "mysql:host=localhost;port=3306;dbname=regapp_db;charset=utf8mb4";
        $pdo_db = new PDO($dsn_db, 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        
        echo "<div class='success'>✓ Successfully connected to regapp_db database</div>";
        
        // Test application database connection
        require_once '../../config/database.php';
        $app_pdo = Database::getInstance()->getConnection();
        $stmt = $app_pdo->query("SELECT 'Application connection successful' as status");
        $result = $stmt->fetch();
        echo "<div class='success'>✓ " . $result['status'] . "</div>";
        
        // Create form_values table if it doesn't exist
        $stmt = $pdo_db->prepare("SHOW TABLES LIKE 'form_values'");
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            echo "<p>Creating form_values table...</p>";
            
            $sql = "
                CREATE TABLE form_values (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    value VARCHAR(255) NOT NULL,
                    parent_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_type_value (type, value),
                    INDEX idx_type (type),
                    INDEX idx_parent (parent_id),
                    FOREIGN KEY (parent_id) REFERENCES form_values(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            
            $pdo_db->exec($sql);
            echo "<div class='success'>✓ form_values table created successfully</div>";
        } else {
            echo "<div class='success'>✓ form_values table already exists</div>";
        }
        
    } catch (Exception $e) {
        echo "<div class='error'>✗ Application configuration test failed: " . $e->getMessage() . "</div>";
        $success = false;
    }
}

flush();
ob_flush();

// Step 8: Final verification
$step++;
$progress = ($step / $total_steps) * 100;
echo "<script>updateProgress($progress);</script>";

echo "<h2>Step $step: Final Verification</h2>";

if ($success) {
    try {
        $test_pdo = Database::getInstance()->getConnection();
        
        // Test database access
        $stmt = $test_pdo->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'regapp_db'");
        $count = $stmt->fetch();
        echo "<p><strong>Tables in regapp_db:</strong> {$count['table_count']}</p>";
        
        // Final connectivity test
        $stmt = $test_pdo->query("SELECT 'MySQL is working perfectly!' as final_test, NOW() as current_time");
        $result = $stmt->fetch();
        echo "<div class='success'>✓ " . $result['final_test'] . "</div>";
        echo "<p><strong>Current time from database:</strong> " . $result['current_time'] . "</p>";
        
        // Show all databases
        $stmt = $test_pdo->query("SHOW DATABASES");
        $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "<p><strong>Available databases:</strong> " . implode(', ', $databases) . "</p>";
        
    } catch (Exception $e) {
        echo "<div class='error'>✗ Final verification failed: " . $e->getMessage() . "</div>";
        $success = false;
    }
}

// Final status
echo "<hr>";
echo "<h2>Fix Process Complete!</h2>";

if ($success) {
    echo "<div class='success'>";
    echo "<h3>✓ SUCCESS - MySQL is now fully operational!</h3>";
    echo "<ul>";
    echo "<li>✓ MySQL/MariaDB server is running</li>";
    echo "<li>✓ Database 'regapp_db' is created and accessible</li>";
    echo "<li>✓ Application can connect to database successfully</li>";
    echo "<li>✓ Required tables are set up</li>";
    echo "<li>✓ All tests passed</li>";
    echo "</ul>";
    echo "<p><strong>Your XAMPP MySQL is now ready for use!</strong></p>";
    echo "</div>";
} else {
    echo "<div class='error'>";
    echo "<h3>✗ FAILED - Some issues occurred during the fix process</h3>";
    echo "<p>Please review the error messages above and try running the fix again.</p>";
    echo "</div>";
}

echo "<div class='info'>";
echo "<p><strong>Note:</strong> MySQL server is running in the background. You can now use your application normally.</p>";
echo "<p><strong>Backup location:</strong> Your original data has been backed up to the mysql_backup folders in the XAMPP directory.</p>";
echo "<p><strong>Timestamp:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "</div>";

echo "<div class='navigation'>";
echo "<a href='launcher.html' class='nav-btn'>🏠 Back to Launcher</a>";
echo "<a href='restore_database.php' class='nav-btn'>🔄 Restore Database</a>";
echo "</div>";
?>

    </div>
    
    <script>
        // Auto-scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
        
        // Update final progress
        updateProgress(100);
    </script>
</body>
</html>

<?php
// Clean up
if (isset($process) && is_resource($process)) {
    // Keep the process running for MySQL
}

ob_end_flush();
?>
