<?php
/**
 * Database Restoration Tool
 * Restores backed-up database data while keeping MySQL running
 */

set_time_limit(300);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Restoration Tool</title>
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
        .backup-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-left: 4px solid #007cba; }
        .btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .navigation { margin: 20px 0; text-align: center; }
        .nav-btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; margin: 5px; display: inline-block; }
        .nav-btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Database Restoration Tool</h1>
        
        <div class="navigation">
            <a href="launcher.html" class="nav-btn">🏠 Back to Launcher</a>
            <a href="mysql_web_fix.php" class="nav-btn">⚡ MySQL Fix</a>
        </div>
        
        <?php
        echo "<h2>Step 1: Current MySQL Status</h2>";
        
        // Test MySQL connection
        $mysql_running = false;
        try {
            $pdo = new PDO("mysql:host=localhost;port=3306;charset=utf8mb4", 'root', '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ]);
            
            $mysql_running = true;
            echo "<div class='success'>✓ MySQL is running and accessible</div>";
            
            // Get version
            $version = $pdo->query('SELECT VERSION()')->fetchColumn();
            echo "<p><strong>MySQL Version:</strong> $version</p>";
            
            // List current databases
            $stmt = $pdo->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "<p><strong>Current Databases:</strong> " . implode(', ', $databases) . "</p>";
            
        } catch (Exception $e) {
            echo "<div class='error'>✗ MySQL is not running: " . $e->getMessage() . "</div>";
            echo "<p>Please run the MySQL fix tool first.</p>";
            echo "<div class='navigation'>";
            echo "<a href='mysql_web_fix.php' class='nav-btn'>⚡ Fix MySQL First</a>";
            echo "</div>";
            exit;
        }
        
        echo "<h2>Step 2: Locate Backup Data</h2>";
        
        $xampp_path = 'C:\\xampp';
        $backup_locations = [];
        
        // Find backup directories
        $backup_patterns = [
            $xampp_path . '\\mysql_backup_*',
            $xampp_path . '\\mysql\\data_backup_*',
            $xampp_path . '\\mysql\\data_corrupted_backup'
        ];
        
        foreach ($backup_patterns as $pattern) {
            $matches = glob($pattern);
            foreach ($matches as $match) {
                if (is_dir($match)) {
                    $backup_locations[] = $match;
                }
            }
        }
        
        if (empty($backup_locations)) {
            echo "<div class='warning'>⚠ No backup directories found. Looking for individual database files...</div>";
            
            // Check for individual .sql files
            $sql_files = glob($xampp_path . '\\*.sql');
            $sql_files = array_merge($sql_files, glob($xampp_path . '\\htdocs\\regapp2\\*.sql'));
            
            if (!empty($sql_files)) {
                echo "<p><strong>Found SQL files:</strong></p>";
                foreach ($sql_files as $file) {
                    echo "<div class='backup-item'>📄 " . basename($file) . " - " . date('Y-m-d H:i:s', filemtime($file)) . "</div>";
                }
            }
        } else {
            echo "<div class='success'>✓ Found backup locations:</div>";
            foreach ($backup_locations as $backup) {
                $size = 0;
                $files = 0;
                if (is_dir($backup)) {
                    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($backup));
                    foreach ($iterator as $file) {
                        if ($file->isFile()) {
                            $size += $file->getSize();
                            $files++;
                        }
                    }
                }
                
                echo "<div class='backup-item'>";
                echo "<strong>📁 " . basename($backup) . "</strong><br>";
                echo "Path: $backup<br>";
                echo "Files: $files | Size: " . formatBytes($size) . "<br>";
                echo "Created: " . date('Y-m-d H:i:s', filemtime($backup));
                echo "</div>";
            }
        }
        
        // Function to format bytes
        function formatBytes($bytes) {
            $units = ['B', 'KB', 'MB', 'GB'];
            $bytes = max($bytes, 0);
            $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
            $pow = min($pow, count($units) - 1);
            return round($bytes / (1024 ** $pow), 2) . ' ' . $units[$pow];
        }
        
        echo "<h2>Step 3: Database Restoration Options</h2>";
        
        if (!empty($backup_locations)) {
            $latest_backup = end($backup_locations);
            
            echo "<div class='info'>";
            echo "<h3>Recommended Action:</h3>";
            echo "<p>Restore from latest backup: <strong>" . basename($latest_backup) . "</strong></p>";
            echo "</div>";
            
            // Check what's in the backup
            echo "<h3>Backup Contents Analysis:</h3>";
            
            $regapp_db_path = $latest_backup . '\\regapp_db';
            if (is_dir($regapp_db_path)) {
                echo "<div class='success'>✓ Found regapp_db directory in backup</div>";
                
                $db_files = glob($regapp_db_path . '\\*');
                echo "<p><strong>Database files found:</strong></p>";
                foreach ($db_files as $file) {
                    if (is_file($file)) {
                        $ext = pathinfo($file, PATHINFO_EXTENSION);
                        $size = filesize($file);
                        echo "<div class='backup-item'>📄 " . basename($file) . " ($ext) - " . formatBytes($size) . "</div>";
                    }
                }
                
                // Create restoration script
                echo "<h3>🔄 Start Database Restoration</h3>";
                echo "<form method='post' action=''>";
                echo "<input type='hidden' name='backup_path' value='$latest_backup'>";
                echo "<input type='hidden' name='action' value='restore'>";
                echo "<div class='warning'>";
                echo "<p><strong>⚠ Warning:</strong> This will restore your original database data. Current data in regapp_db will be replaced.</p>";
                echo "</div>";
                echo "<button type='submit' class='btn'>🔄 Restore Database from Backup</button>";
                echo "</form>";
                
            } else {
                echo "<div class='warning'>⚠ regapp_db directory not found in backup. Checking for other database files...</div>";
                
                // Look for .frm, .ibd, .MYD, .MYI files
                $db_files = [];
                $extensions = ['*.frm', '*.ibd', '*.MYD', '*.MYI', '*.opt'];
                
                foreach ($extensions as $ext) {
                    $files = glob($latest_backup . '\\' . $ext);
                    $db_files = array_merge($db_files, $files);
                    
                    // Also check subdirectories
                    $subdirs = glob($latest_backup . '\\*', GLOB_ONLYDIR);
                    foreach ($subdirs as $subdir) {
                        $subfiles = glob($subdir . '\\' . $ext);
                        $db_files = array_merge($db_files, $subfiles);
                    }
                }
                
                if (!empty($db_files)) {
                    echo "<div class='success'>✓ Found database files in backup</div>";
                    echo "<p>Found " . count($db_files) . " database files</p>";
                    
                    echo "<form method='post' action=''>";
                    echo "<input type='hidden' name='backup_path' value='$latest_backup'>";
                    echo "<input type='hidden' name='action' value='restore_files'>";
                    echo "<button type='submit' class='btn'>🔄 Restore Database Files</button>";
                    echo "</form>";
                }
            }
        }
        
        // Handle restoration
        if ($_POST['action'] ?? '' === 'restore' || $_POST['action'] ?? '' === 'restore_files') {
            echo "<hr>";
            echo "<h2>🔄 Restoration Process</h2>";
            
            $backup_path = $_POST['backup_path'];
            echo "<p><strong>Restoring from:</strong> $backup_path</p>";
            
            try {
                // Stop MySQL temporarily for file copy
                echo "<p>1. Temporarily stopping MySQL for safe file restoration...</p>";
                exec('taskkill /f /im mysqld.exe 2>nul');
                sleep(3);
                
                // Copy database files
                echo "<p>2. Copying database files...</p>";
                
                $mysql_data = $xampp_path . '\\mysql\\data';
                
                if ($_POST['action'] === 'restore') {
                    $source_db = $backup_path . '\\regapp_db';
                    $target_db = $mysql_data . '\\regapp_db';
                    
                    if (is_dir($source_db)) {
                        // Remove existing regapp_db
                        if (is_dir($target_db)) {
                            rmdir_recursive($target_db);
                        }
                        
                        // Copy backup
                        copy_recursive($source_db, $target_db);
                        echo "<div class='success'>✓ Copied regapp_db from backup</div>";
                    }
                } else {
                    // Copy all database files
                    $iterator = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($backup_path),
                        RecursiveIteratorIterator::SELF_FIRST
                    );
                    
                    foreach ($iterator as $file) {
                        if ($file->isFile()) {
                            $ext = pathinfo($file, PATHINFO_EXTENSION);
                            if (in_array($ext, ['frm', 'ibd', 'MYD', 'MYI', 'opt'])) {
                                $relativePath = str_replace($backup_path, '', $file->getPathname());
                                $targetPath = $mysql_data . $relativePath;
                                
                                // Create directory if needed
                                $targetDir = dirname($targetPath);
                                if (!is_dir($targetDir)) {
                                    mkdir($targetDir, 0755, true);
                                }
                                
                                copy($file->getPathname(), $targetPath);
                                echo "<div class='backup-item'>✓ Copied " . basename($file) . "</div>";
                            }
                        }
                    }
                }
                
                // Restart MySQL
                echo "<p>3. Restarting MySQL...</p>";
                $mysql_cmd = "\"$xampp_path\\mysql\\bin\\mysqld.exe\" --defaults-file=\"$xampp_path\\mysql\\bin\\my.ini\" --standalone --console";
                
                $process = popen($mysql_cmd . ' 2>&1', 'r');
                if ($process) {
                    echo "<div class='success'>✓ MySQL restarted</div>";
                    
                    // Wait for MySQL to be ready
                    $max_wait = 30;
                    $wait_count = 0;
                    $mysql_ready = false;
                    
                    while ($wait_count < $max_wait && !$mysql_ready) {
                        sleep(1);
                        $wait_count++;
                        
                        $connection = @fsockopen('localhost', 3306, $errno, $errstr, 1);
                        if ($connection) {
                            fclose($connection);
                            $mysql_ready = true;
                            echo "<div class='success'>✓ MySQL is ready after $wait_count seconds</div>";
                        }
                    }
                    
                    if ($mysql_ready) {
                        // Test database access
                        echo "<p>4. Testing restored database...</p>";
                        
                        $pdo_test = new PDO("mysql:host=localhost;port=3306;charset=utf8mb4", 'root', '', [
                            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                        ]);
                        
                        $stmt = $pdo_test->query("SHOW DATABASES");
                        $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
                        echo "<p><strong>Available databases:</strong> " . implode(', ', $databases) . "</p>";
                        
                        if (in_array('regapp_db', $databases)) {
                            echo "<div class='success'>✓ regapp_db database is restored and accessible</div>";
                            
                            // Test connection to regapp_db
                            $pdo_regapp = new PDO("mysql:host=localhost;port=3306;dbname=regapp_db;charset=utf8mb4", 'root', '');
                            $stmt = $pdo_regapp->query("SHOW TABLES");
                            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                            
                            echo "<p><strong>Tables in regapp_db:</strong> " . implode(', ', $tables) . "</p>";
                            
                            // Test application connection
                            require_once '../../config/database.php';
                            $app_pdo = Database::getInstance()->getConnection();
                            $stmt = $app_pdo->query("SELECT 'Database restoration successful!' as status");
                            $result = $stmt->fetch();
                            
                            echo "<div class='success'><h3>🎉 " . $result['status'] . "</h3></div>";
                            echo "<div class='info'>";
                            echo "<p><strong>✅ Restoration Complete!</strong></p>";
                            echo "<p>Your original database data has been successfully restored.</p>";
                            echo "<p>MySQL is running and your application can now access all your data.</p>";
                            echo "</div>";
                            
                        } else {
                            echo "<div class='warning'>⚠ regapp_db not found. You may need to manually recreate it.</div>";
                        }
                    }
                }
                
            } catch (Exception $e) {
                echo "<div class='error'>✗ Restoration failed: " . $e->getMessage() . "</div>";
            }
        }
        
        // Helper functions
        function copy_recursive($src, $dst) {
            $dir = opendir($src);
            if (!is_dir($dst)) {
                mkdir($dst, 0755, true);
            }
            
            while (($file = readdir($dir)) !== false) {
                if ($file != '.' && $file != '..') {
                    $srcFile = $src . '\\' . $file;
                    $dstFile = $dst . '\\' . $file;
                    
                    if (is_dir($srcFile)) {
                        copy_recursive($srcFile, $dstFile);
                    } else {
                        copy($srcFile, $dstFile);
                    }
                }
            }
            closedir($dir);
        }
        
        function rmdir_recursive($dir) {
            if (is_dir($dir)) {
                $objects = scandir($dir);
                foreach ($objects as $object) {
                    if ($object != "." && $object != "..") {
                        if (is_dir($dir . "\\" . $object)) {
                            rmdir_recursive($dir . "\\" . $object);
                        } else {
                            unlink($dir . "\\" . $object);
                        }
                    }
                }
                rmdir($dir);
            }
        }
        ?>
        
        <hr>
        <div class="info">
            <h3>📋 Manual Options</h3>
            <p>If automatic restoration doesn't work, you can:</p>
            <ul>
                <li><strong>Browse backups:</strong> Check C:\xampp\mysql_backup_* directories</li>
                <li><strong>Import SQL files:</strong> Use phpMyAdmin to import .sql files</li>
                <li><strong>Copy specific tables:</strong> Copy individual .frm/.ibd files</li>
            </ul>
            
            <a href="../../diagnose_mysql.php" class="btn" target="_blank">🔍 Check MySQL Status</a>
            <a href="http://localhost/phpmyadmin" class="btn" target="_blank">🗃️ Open phpMyAdmin</a>
        </div>
        
        <div class="navigation">
            <a href="launcher.html" class="nav-btn">🏠 Back to Launcher</a>
            <a href="mysql_web_fix.php" class="nav-btn">⚡ MySQL Fix</a>
        </div>
    </div>
</body>
</html>
