<?php
require_once 'config/database.php';

try {
    $pdo = Database::getInstance()->getConnection();
    
    echo "Creating profile extension tables...\n";
    
    // User Education Table
    $sql1 = "
        CREATE TABLE IF NOT EXISTS user_education (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            family_member_type ENUM('member', 'spouse', 'child') NOT NULL DEFAULT 'member',
            family_member_index INT DEFAULT NULL,
            degree VARCHAR(255) NOT NULL,
            department VARCHAR(255),
            institution VARCHAR(255),
            year_of_completion YEAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_education (user_id),
            INDEX idx_family_type (family_member_type),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql1);
    echo "✅ user_education table created!\n";
    
    // User Profession Table
    $sql2 = "
        CREATE TABLE IF NOT EXISTS user_profession (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            family_member_type ENUM('member', 'spouse', 'child') NOT NULL DEFAULT 'member',
            family_member_index INT DEFAULT NULL,
            job_type ENUM('Self-employed', 'Government', 'Private', 'Others') NOT NULL,
            job_type_other VARCHAR(255) DEFAULT NULL,
            company_name VARCHAR(255),
            position VARCHAR(255),
            experience_years INT DEFAULT 0,
            experience_months INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_profession (user_id),
            INDEX idx_family_type (family_member_type),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql2);
    echo "✅ user_profession table created!\n";
    
    // User Kulam Details Table
    $sql3 = "
        CREATE TABLE IF NOT EXISTS user_kulam_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            family_member_type ENUM('member', 'spouse', 'child', 'parent', 'grandparent') NOT NULL DEFAULT 'member',
            family_member_index INT DEFAULT NULL,
            family_member_subtype VARCHAR(50) DEFAULT NULL,
            kulam VARCHAR(255),
            kulam_other VARCHAR(255) DEFAULT NULL,
            kula_deivam VARCHAR(255),
            kula_deivam_other VARCHAR(255) DEFAULT NULL,
            kaani VARCHAR(255),
            kaani_other VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_kulam (user_id),
            INDEX idx_family_type (family_member_type),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql3);
    echo "✅ user_kulam_details table created!\n";
    
    // User Family Additional Details Table
    $sql4 = "
        CREATE TABLE IF NOT EXISTS user_family_additional_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            family_member_type ENUM('parent', 'grandparent') NOT NULL,
            family_member_subtype VARCHAR(50) NOT NULL,
            native_place VARCHAR(255),
            place_of_residence VARCHAR(255),
            same_as_native BOOLEAN DEFAULT FALSE,
            live_status ENUM('live', 'deceased') DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_family (user_id),
            INDEX idx_family_type (family_member_type),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql4);
    echo "✅ user_family_additional_details table created!\n";
    
    echo "\n🎉 All profile extension tables created successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
