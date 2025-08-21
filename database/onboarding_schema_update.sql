-- Onboarding Schema Update for user_profile table
-- Add new fields for comprehensive user onboarding

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS hasChildren ENUM('yes', 'no') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS role ENUM('son', 'daughter', 'husband', 'wife', 'father', 'mother') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS isMarried ENUM('yes', 'no') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS marriageStatus ENUM('unmarried', 'married', 'complicated') NULL;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS statusAcceptance ENUM('valid', 'invalid') NULL;

-- Add onboarding completion tracking
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS intro_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS questions_completed BOOLEAN DEFAULT FALSE;

-- Create spouse details table
CREATE TABLE IF NOT EXISTS spouse_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    gender ENUM('male', 'female') NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Create children details table
CREATE TABLE IF NOT EXISTS children_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    gender ENUM('male', 'female') NOT NULL,
    date_of_birth DATE,
    relationship ENUM('son', 'daughter') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Create family tree table for member and spouse
CREATE TABLE IF NOT EXISTS family_tree (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tree_type ENUM('member', 'spouse') NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    paternal_grandfather_name VARCHAR(255),
    paternal_grandmother_name VARCHAR(255),
    maternal_grandfather_name VARCHAR(255),
    maternal_grandmother_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_user_tree (user_id, tree_type)
);

-- Add comment for tracking
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS profile_completion_step ENUM('intro', 'questions', 'member_details', 'spouse_details', 'children_details', 'member_family_tree', 'spouse_family_tree', 'completed') DEFAULT 'intro';
