-- Profile Extension Tables Migration
-- Version: 003
-- Description: Add tables for education, profession, and kulam details
-- Date: 2024-01-01

-- Create user_education table
CREATE TABLE IF NOT EXISTS user_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    family_member_type ENUM('member', 'spouse', 'child') NOT NULL DEFAULT 'member',
    family_member_index INT DEFAULT NULL, -- For children (child 1, child 2, etc.)
    degree VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    institution VARCHAR(255),
    year_of_completion YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_education (user_id),
    INDEX idx_family_type (family_member_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_profession table
CREATE TABLE IF NOT EXISTS user_profession (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    family_member_type ENUM('member', 'spouse', 'child') NOT NULL DEFAULT 'member',
    family_member_index INT DEFAULT NULL, -- For children (child 1, child 2, etc.)
    job_type ENUM('Self-employed', 'Government', 'Private', 'Others') NOT NULL,
    job_type_other VARCHAR(255) DEFAULT NULL, -- When job_type is 'Others'
    company_name VARCHAR(255),
    position VARCHAR(255),
    experience_years INT DEFAULT 0,
    experience_months INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_profession (user_id),
    INDEX idx_family_type (family_member_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_kulam_details table
CREATE TABLE IF NOT EXISTS user_kulam_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    family_member_type ENUM('member', 'spouse', 'child', 'parent', 'grandparent') NOT NULL DEFAULT 'member',
    family_member_index INT DEFAULT NULL, -- For children (child 1, child 2, etc.) or parents/grandparents
    family_member_subtype VARCHAR(50) DEFAULT NULL, -- 'father', 'mother', 'paternal_grandfather', etc.
    kulam VARCHAR(255),
    kulam_other VARCHAR(255) DEFAULT NULL, -- When kulam is 'Other'
    kula_deivam VARCHAR(255),
    kula_deivam_other VARCHAR(255) DEFAULT NULL, -- When kula_deivam is 'Other'
    kaani VARCHAR(255),
    kaani_other VARCHAR(255) DEFAULT NULL, -- When kaani is 'Other'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_kulam (user_id),
    INDEX idx_family_type (family_member_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_family_additional_details table for parents/grandparents
CREATE TABLE IF NOT EXISTS user_family_additional_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    family_member_type ENUM('parent', 'grandparent') NOT NULL,
    family_member_subtype VARCHAR(50) NOT NULL, -- 'father', 'mother', 'paternal_grandfather', etc.
    native_place VARCHAR(255),
    place_of_residence VARCHAR(255),
    same_as_native BOOLEAN DEFAULT FALSE,
    live_status ENUM('live', 'deceased') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_family (user_id),
    INDEX idx_family_type (family_member_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration completed successfully
SELECT 'Profile extension tables migration completed successfully!' as status;
