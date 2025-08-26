-- =============================================================================
-- FIX PHONE COLUMN LENGTH MIGRATION
-- =============================================================================
-- Issue: Phone column VARCHAR(15) is too short for international numbers with country codes
-- Solution: Increase to VARCHAR(20) to accommodate longer international numbers
-- Examples: +919988776655 (14 chars), +1234567890123 (14 chars), etc.
-- =============================================================================

USE regapp_db;

-- Update users table phone column
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20);

-- Update user_profiles table phone column  
ALTER TABLE user_profiles MODIFY COLUMN phone VARCHAR(20);

-- Update invitations table phone columns
ALTER TABLE invitations MODIFY COLUMN invited_phone VARCHAR(20);

-- Update user_profiles emergency contact phone column
ALTER TABLE user_profiles MODIFY COLUMN emergency_contact_phone VARCHAR(20);

-- Verify the changes
SHOW COLUMNS FROM users LIKE 'phone';
SHOW COLUMNS FROM user_profiles LIKE 'phone';
SHOW COLUMNS FROM user_profiles LIKE 'emergency_contact_phone';
SHOW COLUMNS FROM invitations LIKE 'invited_phone';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
