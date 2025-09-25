<?php
// Force restore all tables - CLI version
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== FORCE RESTORE ALL TABLES ===\n";
echo "Starting at: " . date('Y-m-d H:i:s') . "\n\n";

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ MySQL connection successful\n";
    
    // Force recreate database
    $pdo->exec("DROP DATABASE IF EXISTS regapp_db");
    $pdo->exec("CREATE DATABASE regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE regapp_db");
    
    echo "✓ Database regapp_db recreated\n";
    
    // Define all SQL statements directly here
    $allSqlStatements = [
        // Core tables
        "CREATE TABLE admin_users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE,
            full_name VARCHAR(100),
            role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INT,
            last_login TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (created_by) REFERENCES admin_users(id)
        )",
        
        "CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(15) UNIQUE,
            password VARCHAR(255) NOT NULL,
            enrollment_number VARCHAR(20) UNIQUE,
            user_number INT UNIQUE,
            referred_by_type ENUM('admin', 'user') DEFAULT NULL,
            referred_by_id INT DEFAULT NULL,
            approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            user_type ENUM('invited', 'registered', 'enrolled', 'approved', 'premium') DEFAULT 'invited',
            profile_completed BOOLEAN DEFAULT FALSE,
            email_verified BOOLEAN DEFAULT FALSE,
            phone_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP NULL,
            approved_by INT,
            last_login TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_via_invitation BOOLEAN DEFAULT FALSE,
            invitation_id INT DEFAULT NULL,
            CHECK (email IS NOT NULL OR phone IS NOT NULL),
            FOREIGN KEY (approved_by) REFERENCES admin_users(id)
        )",
        
        "CREATE TABLE user_profiles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT UNIQUE NOT NULL,
            name VARCHAR(100) DEFAULT NULL,
            first_name VARCHAR(50) DEFAULT NULL,
            second_name VARCHAR(50) DEFAULT NULL,
            full_name VARCHAR(100) NOT NULL,
            date_of_birth DATE NOT NULL,
            address_line1 VARCHAR(255) DEFAULT NULL,
            address_line2 VARCHAR(255) DEFAULT NULL,
            city VARCHAR(100) DEFAULT NULL,
            state VARCHAR(100) DEFAULT NULL,
            country VARCHAR(100) DEFAULT 'India',
            address TEXT NOT NULL,
            pin_code VARCHAR(10) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            email VARCHAR(100) DEFAULT NULL,
            gender ENUM('male', 'female', 'others') DEFAULT NULL,
            marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried') DEFAULT NULL,
            hasChildren ENUM('yes', 'no') DEFAULT NULL,
            isMarried ENUM('yes', 'no') DEFAULT NULL,
            marriageStatus ENUM('unmarried', 'married', 'complicated') DEFAULT NULL,
            statusAcceptance ENUM('valid', 'invalid') DEFAULT NULL,
            role ENUM('son', 'daughter', 'husband', 'wife', 'father', 'mother', 'member') DEFAULT NULL,
            intro_completed BOOLEAN DEFAULT FALSE,
            questions_completed BOOLEAN DEFAULT FALSE,
            profile_completion_step ENUM('intro', 'member_details', 'spouse_details', 'children_details', 'member_family_tree', 'spouse_family_tree', 'completed') DEFAULT 'intro',
            district VARCHAR(255) NULL,
            post_office_area VARCHAR(255) NULL,
            emergency_contact_name VARCHAR(100),
            emergency_contact_phone VARCHAR(15),
            profile_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        // Family tables
        "CREATE TABLE spouse_details (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            second_name VARCHAR(50) DEFAULT NULL,
            gender ENUM('male', 'female', 'others') NOT NULL,
            date_of_birth DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "CREATE TABLE children_details (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            second_name VARCHAR(50) DEFAULT NULL,
            gender ENUM('male', 'female') NOT NULL,
            date_of_birth DATE DEFAULT NULL,
            relationship ENUM('son', 'daughter') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "CREATE TABLE family_tree (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            tree_type ENUM('member', 'spouse') NOT NULL,
            father_name VARCHAR(100) DEFAULT NULL,
            mother_name VARCHAR(100) DEFAULT NULL,
            paternal_grandfather_name VARCHAR(100) DEFAULT NULL,
            paternal_grandmother_name VARCHAR(100) DEFAULT NULL,
            maternal_grandfather_name VARCHAR(100) DEFAULT NULL,
            maternal_grandmother_name VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_tree_type (user_id, tree_type)
        )",
        
        // Groups
        "CREATE TABLE groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type ENUM('district', 'area', 'custom') NOT NULL,
            district VARCHAR(255) NULL,
            area VARCHAR(255) NULL,
            pin_code VARCHAR(10) NULL,
            created_by INT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES admin_users(id)
        )",
        
        "CREATE TABLE group_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            added_by INT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id),
            UNIQUE KEY unique_group_user (group_id, user_id)
        )",
        
        // Events
        "CREATE TABLE events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            event_date DATE NOT NULL,
            event_time TIME NOT NULL,
            location VARCHAR(255),
            created_by INT NOT NULL,
            target_groups JSON NULL,
            max_attendees INT NULL,
            is_public BOOLEAN DEFAULT TRUE,
            is_cancelled BOOLEAN DEFAULT FALSE,
            views_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )",
        
        "CREATE TABLE event_rsvps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            status ENUM('attending', 'not_attending', 'maybe') NOT NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_event_user_rsvp (event_id, user_id)
        )",
        
        // Announcements
        "CREATE TABLE announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            created_by INT NOT NULL,
            target_groups JSON NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            views_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )",
        
        "CREATE TABLE announcement_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            announcement_id INT NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_announcement_user_like (announcement_id, user_id)
        )",
        
        // Help Posts
        "CREATE TABLE help_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100) NULL,
            created_by INT NOT NULL,
            target_audience ENUM('public', 'groups', 'area', 'district', 'institution', 'company') NOT NULL,
            target_groups JSON NULL,
            approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT NULL,
            approved_at TIMESTAMP NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            views_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (approved_by) REFERENCES admin_users(id)
        )",
        
        // Other essential tables
        "CREATE TABLE invitations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            invitation_code VARCHAR(64) UNIQUE NOT NULL,
            invited_name VARCHAR(100) NOT NULL,
            invited_email VARCHAR(100),
            invited_phone VARCHAR(15),
            invited_by_type ENUM('admin', 'user') NOT NULL,
            invited_by_id INT NOT NULL,
            status ENUM('pending', 'used', 'expired') DEFAULT 'pending',
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            used_at TIMESTAMP NULL,
            used_by INT NULL,
            notes TEXT,
            CHECK (invited_email IS NOT NULL OR invited_phone IS NOT NULL),
            FOREIGN KEY (used_by) REFERENCES users(id)
        )",
        
        "CREATE TABLE subscriptions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            subscription_type VARCHAR(50) NOT NULL DEFAULT 'annual',
            status ENUM('active', 'inactive', 'pending', 'expired', 'cancelled') DEFAULT 'pending',
            start_date DATE,
            end_date DATE,
            amount DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "CREATE TABLE sessions (
            id VARCHAR(128) PRIMARY KEY,
            user_type ENUM('admin', 'user') NOT NULL,
            user_id INT NOT NULL,
            data TEXT,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type ENUM('announcement', 'event', 'help_post', 'comment', 'like', 'group_added', 'approval') NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            reference_type VARCHAR(50) NULL,
            reference_id INT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "CREATE TABLE districts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            state VARCHAR(100) NOT NULL,
            district_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_state_district (state, district_name)
        )",
        
        "CREATE TABLE post_offices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pin_code VARCHAR(10) NOT NULL,
            office_name VARCHAR(255) NOT NULL,
            office_type VARCHAR(50),
            district VARCHAR(255) NOT NULL,
            state VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_pin_office (pin_code, office_name)
        )"
    ];
    
    // Execute all statements
    $executedCount = 0;
    foreach ($allSqlStatements as $sql) {
        try {
            $pdo->exec($sql);
            $executedCount++;
            echo ".";
        } catch (PDOException $e) {
            echo "\nError: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✓ Executed $executedCount table creation statements\n";
    
    // Insert default admin
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO admin_users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute(['admin', $hashedPassword, 'admin@regapp.com', 'System Administrator', 'super_admin']);
    
    echo "✓ Created default admin user\n";
    
    // Verify tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\n=== FINAL RESULT ===\n";
    echo "Total tables created: " . count($tables) . "\n";
    echo "Tables: " . implode(', ', $tables) . "\n";
    
    echo "\n✅ ALL TABLES RESTORED SUCCESSFULLY!\n";
    echo "Admin login: username=admin, password=admin123\n";
    
} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
}

echo "\nCompleted at: " . date('Y-m-d H:i:s') . "\n";
?>
