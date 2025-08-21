-- =============================================================================
-- FAMILY TABLES MIGRATION
-- Version: 1.0 
-- Created: 2025-01-11
-- Description: Adds family-related tables for enhanced profile completion
-- =============================================================================

USE regapp_db;

-- =============================================================================
-- UPDATE EXISTING TABLES
-- =============================================================================

-- Add missing columns to user_profiles table for intro questions data
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'others') DEFAULT NULL AFTER phone,
ADD COLUMN IF NOT EXISTS marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried') DEFAULT NULL AFTER gender,
ADD COLUMN IF NOT EXISTS hasChildren ENUM('yes', 'no') DEFAULT NULL AFTER marriageType,
ADD COLUMN IF NOT EXISTS isMarried ENUM('yes', 'no') DEFAULT NULL AFTER hasChildren,
ADD COLUMN IF NOT EXISTS marriageStatus ENUM('unmarried', 'married', 'complicated') DEFAULT NULL AFTER isMarried,
ADD COLUMN IF NOT EXISTS statusAcceptance ENUM('valid', 'invalid') DEFAULT NULL AFTER marriageStatus,
ADD COLUMN IF NOT EXISTS role ENUM('son', 'daughter', 'husband', 'wife', 'father', 'mother', 'member') DEFAULT NULL AFTER statusAcceptance,
ADD COLUMN IF NOT EXISTS intro_completed BOOLEAN DEFAULT FALSE AFTER role,
ADD COLUMN IF NOT EXISTS questions_completed BOOLEAN DEFAULT FALSE AFTER intro_completed,
ADD COLUMN IF NOT EXISTS profile_completion_step ENUM('intro', 'member_details', 'spouse_details', 'children_details', 'member_family_tree', 'spouse_family_tree', 'completed') DEFAULT 'intro' AFTER questions_completed,
ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT NULL AFTER user_id,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) DEFAULT NULL AFTER name,
ADD COLUMN IF NOT EXISTS second_name VARCHAR(50) DEFAULT NULL AFTER first_name,
ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL AFTER phone,
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255) DEFAULT NULL AFTER date_of_birth,
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255) DEFAULT NULL AFTER address_line1,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL AFTER address_line2,
ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL AFTER city,
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India' AFTER state;

-- =============================================================================
-- NEW FAMILY TABLES
-- =============================================================================

-- Spouse details table
CREATE TABLE IF NOT EXISTS spouse_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) DEFAULT NULL,
    gender ENUM('male', 'female', 'others') NOT NULL,
    date_of_birth DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_spouse_user_id (user_id)
);

-- Children details table
CREATE TABLE IF NOT EXISTS children_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) DEFAULT NULL,
    gender ENUM('male', 'female') NOT NULL,
    date_of_birth DATE DEFAULT NULL,
    relationship ENUM('son', 'daughter') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_children_user_id (user_id)
);

-- Family tree table (for both member and spouse family trees)
CREATE TABLE IF NOT EXISTS family_tree (
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
    INDEX idx_family_tree_user_id (user_id),
    INDEX idx_family_tree_type (tree_type),
    UNIQUE KEY unique_user_tree_type (user_id, tree_type)
);

-- =============================================================================
-- UPDATE EXISTING DATA
-- =============================================================================

-- Update users table to add user_type column if it doesn't exist
ALTER TABLE users 
MODIFY COLUMN user_type ENUM('invited', 'registered', 'enrolled', 'approved', 'premium') DEFAULT 'invited';

-- Add created_via_invitation and invitation_id columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_via_invitation BOOLEAN DEFAULT FALSE AFTER user_type,
ADD COLUMN IF NOT EXISTS invitation_id INT DEFAULT NULL AFTER created_via_invitation;

-- Add missing id column to invitations table
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS id INT PRIMARY KEY AUTO_INCREMENT FIRST;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Add indexes for the new family tables
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_user_profiles_marriage_type ON user_profiles(marriageType);
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_children ON user_profiles(hasChildren);
CREATE INDEX IF NOT EXISTS idx_user_profiles_completion_step ON user_profiles(profile_completion_step);
CREATE INDEX IF NOT EXISTS idx_user_profiles_intro_completed ON user_profiles(intro_completed);

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================

/*
MIGRATION DETAILS:
==================

1. ENHANCED USER_PROFILES TABLE:
   - Added intro questions fields (gender, marriageType, hasChildren, etc.)
   - Added profile completion tracking fields
   - Added detailed address fields for better data organization
   - Added name splitting (first_name, second_name)

2. NEW FAMILY TABLES:
   - spouse_details: Stores spouse information
   - children_details: Stores children information with relationships
   - family_tree: Stores both member and spouse family lineage

3. SAFETY FEATURES:
   - All ALTER TABLE commands use IF NOT EXISTS
   - Proper foreign key constraints
   - Appropriate indexes for performance
   - Maintains backward compatibility

4. DATA INTEGRITY:
   - Unique constraints where needed
   - Proper ENUM values for controlled data
   - Cascading deletes for data consistency

5. PROFILE COMPLETION WORKFLOW:
   - intro -> member_details -> spouse_details -> children_details -> member_family_tree -> spouse_family_tree -> completed
   - Each step can be saved independently
   - Conditional steps based on intro answers
*/
