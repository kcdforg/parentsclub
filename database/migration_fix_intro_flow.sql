-- Migration Script: Fix Introduction and Profile Flow
-- Created: 2025-01-11
-- Purpose: Add missing columns to support proper introduction and profile completion tracking

USE regapp_db;

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_via_invitation BOOLEAN DEFAULT FALSE AFTER approval_status,
ADD COLUMN IF NOT EXISTS invitation_id INT NULL AFTER created_via_invitation;

-- Add missing columns to user_profiles table for introduction questions tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS intro_completed BOOLEAN DEFAULT FALSE AFTER profile_completed,
ADD COLUMN IF NOT EXISTS questions_completed BOOLEAN DEFAULT FALSE AFTER intro_completed,
ADD COLUMN IF NOT EXISTS profile_completion_step VARCHAR(50) DEFAULT NULL AFTER questions_completed,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'others') DEFAULT NULL AFTER phone,
ADD COLUMN IF NOT EXISTS marriageType ENUM('unmarried', 'married', 'widowed', 'divorced', 'remarried') DEFAULT NULL AFTER gender,
ADD COLUMN IF NOT EXISTS hasChildren ENUM('yes', 'no') DEFAULT 'no' AFTER marriageType,
ADD COLUMN IF NOT EXISTS isMarried ENUM('yes', 'no') DEFAULT 'no' AFTER hasChildren,
ADD COLUMN IF NOT EXISTS marriageStatus VARCHAR(50) DEFAULT NULL AFTER isMarried,
ADD COLUMN IF NOT EXISTS statusAcceptance ENUM('valid', 'invalid') DEFAULT 'valid' AFTER marriageStatus,
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT NULL AFTER statusAcceptance,
ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT NULL AFTER role;

-- Make full_name, date_of_birth, address, pin_code, phone nullable as they are filled later
ALTER TABLE user_profiles 
MODIFY COLUMN full_name VARCHAR(100) NULL,
MODIFY COLUMN date_of_birth DATE NULL,
MODIFY COLUMN address TEXT NULL,
MODIFY COLUMN pin_code VARCHAR(10) NULL,
MODIFY COLUMN phone VARCHAR(15) NULL;

-- Add foreign key for invitation_id if it doesn't exist
ALTER TABLE users 
ADD CONSTRAINT fk_users_invitation_id 
FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_via_invitation ON users(created_via_invitation);
CREATE INDEX IF NOT EXISTS idx_user_profiles_intro_completed ON user_profiles(intro_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_questions_completed ON user_profiles(questions_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completion_step ON user_profiles(profile_completion_step);

-- Update existing users who were created via invitation to set the flag
UPDATE users u
SET created_via_invitation = TRUE, 
    invitation_id = (
        SELECT i.id 
        FROM invitations i 
        WHERE i.used_by = u.id 
        LIMIT 1
    )
WHERE u.id IN (
    SELECT DISTINCT used_by 
    FROM invitations 
    WHERE used_by IS NOT NULL
);

-- Note: Run this migration script in phpMyAdmin or MySQL command line
-- Verify the changes by running: DESCRIBE users; and DESCRIBE user_profiles;
