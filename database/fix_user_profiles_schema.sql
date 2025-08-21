-- Fix user_profiles table schema
-- Add missing columns for profile completion

-- First ensure the table name is correct (some schemas use user_profile, others user_profiles)
-- This will create the table if it doesn't exist with the correct name

CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100),
    name VARCHAR(255),
    first_name VARCHAR(100),
    second_name VARCHAR(100),
    gender ENUM('male', 'female', 'others'),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(10),
    
    -- Intro data fields
    marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried'),
    hasChildren ENUM('yes', 'no'),
    role ENUM('son', 'daughter', 'husband', 'wife', 'father', 'mother'),
    isMarried ENUM('yes', 'no'),
    marriageStatus ENUM('unmarried', 'married', 'complicated'),
    
    -- Completion tracking
    profile_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INT DEFAULT 0,
    intro_completed BOOLEAN DEFAULT FALSE,
    profile_completion_step ENUM('intro', 'questions', 'member_details', 'spouse_details', 'children_details', 'member_family_tree', 'spouse_family_tree', 'completed') DEFAULT 'intro',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_id (user_id),
    INDEX idx_user_id (user_id)
);

-- Add missing columns if table already exists
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS second_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'others');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Add intro data columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hasChildren ENUM('yes', 'no');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role ENUM('son', 'daughter', 'husband', 'wife', 'father', 'mother');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS isMarried ENUM('yes', 'no');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS marriageStatus ENUM('unmarried', 'married', 'complicated');

-- Add completion tracking columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intro_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_completion_step ENUM('intro', 'questions', 'member_details', 'spouse_details', 'children_details', 'member_family_tree', 'spouse_family_tree', 'completed') DEFAULT 'intro';

-- If the table was named user_profile (singular), copy data and rename
-- This handles the schema inconsistency issue
INSERT IGNORE INTO user_profiles (user_id, full_name, date_of_birth, phone, pin_code, profile_completed, created_at, updated_at)
SELECT user_id, full_name, date_of_birth, phone, pin_code, profile_completed, created_at, updated_at 
FROM user_profile 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profile' AND table_schema = DATABASE());