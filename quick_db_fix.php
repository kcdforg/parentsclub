<?php
/**
 * Quick Database Fix - Restore regapp_db and required tables
 */

set_time_limit(300);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Quick Database Fix</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .success { background: #d4edda; color: #155724; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .info { background: #d1ecf1; color: #0c5460; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Quick Database Fix</h1>
        
        <?php
        try {
            // Step 1: Connect to MySQL (without database)
            echo "<h2>Step 1: Connecting to MySQL...</h2>";
            $pdo = new PDO("mysql:host=localhost;port=3306;charset=utf8mb4", 'root', '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            echo "<div class='success'>✓ Connected to MySQL server</div>";
            
            // Step 2: Create database
            echo "<h2>Step 2: Creating regapp_db database...</h2>";
            $pdo->exec("CREATE DATABASE IF NOT EXISTS regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            echo "<div class='success'>✓ Database regapp_db created</div>";
            
            // Step 3: Use the database
            $pdo->exec("USE regapp_db");
            echo "<div class='success'>✓ Using regapp_db database</div>";
            
            // Step 4: Create admin_users table
            echo "<h2>Step 3: Creating admin_users table...</h2>";
            $adminUsersSQL = "
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100),
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($adminUsersSQL);
            echo "<div class='success'>✓ admin_users table created</div>";
            
            // Step 5: Create sessions table
            echo "<h2>Step 4: Creating sessions table...</h2>";
            $sessionsSQL = "
                CREATE TABLE IF NOT EXISTS sessions (
                    id VARCHAR(64) PRIMARY KEY,
                    user_type ENUM('admin', 'user') NOT NULL,
                    user_id INT NOT NULL,
                    data JSON,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user (user_type, user_id),
                    INDEX idx_expires (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            $pdo->exec($sessionsSQL);
            echo "<div class='success'>✓ sessions table created</div>";
            
            // Step 6: Create form_values table
            echo "<h2>Step 5: Creating form_values table...</h2>";
            $formValuesSQL = "
                CREATE TABLE IF NOT EXISTS form_values (
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
            $pdo->exec($formValuesSQL);
            echo "<div class='success'>✓ form_values table created</div>";
            
            // Step 7: Create default admin user if none exists
            echo "<h2>Step 6: Creating default admin user...</h2>";
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM admin_users");
            $count = $stmt->fetch()['count'];
            
            if ($count == 0) {
                $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO admin_users (username, email, password, full_name) VALUES (?, ?, ?, ?)");
                $stmt->execute(['admin', 'admin@regapp.local', $defaultPassword, 'System Administrator']);
                echo "<div class='success'>✓ Default admin user created</div>";
                echo "<div class='info'><strong>Login Credentials:</strong><br>Username: admin<br>Password: admin123</div>";
            } else {
                echo "<div class='info'>✓ Admin users already exist ($count users)</div>";
            }
            
            // Step 8: Test database connection
            echo "<h2>Step 7: Testing application connection...</h2>";
            require_once 'config/database.php';
            $testDB = Database::getInstance()->getConnection();
            $stmt = $testDB->query("SELECT DATABASE() as current_db, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE()");
            $result = $stmt->fetch();
            echo "<div class='success'>✓ Application can connect to: {$result['current_db']}</div>";
            echo "<div class='success'>✓ Found {$result['table_count']} tables in database</div>";
            
            echo "<hr>";
            echo "<div class='success'>";
            echo "<h2>🎉 Database Fix Complete!</h2>";
            echo "<p><strong>Your login should now work!</strong></p>";
            echo "<ul>";
            echo "<li>✅ regapp_db database created</li>";
            echo "<li>✅ admin_users table ready</li>";
            echo "<li>✅ sessions table ready</li>";
            echo "<li>✅ form_values table ready</li>";
            if ($count == 0) {
                echo "<li>✅ Default admin user created</li>";
            }
            echo "</ul>";
            echo "</div>";
            
        } catch (Exception $e) {
            echo "<div class='error'>";
            echo "<h3>❌ Error occurred:</h3>";
            echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
            echo "</div>";
        }
        ?>
        
        <div style="margin-top: 30px;">
            <a href="admin/frontend/login.html" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🔑 Go to Admin Login</a>
        </div>
    </div>
</body>
</html>

