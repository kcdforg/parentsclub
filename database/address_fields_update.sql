-- =============================================================================
-- ADDRESS FIELDS UPDATE MIGRATION
-- =============================================================================
-- Purpose: Update address fields based on new form requirements
-- Changes:
-- 1. Add district field (if not exists)
-- 2. Add permanent address fields 
-- 3. Remove post_office_area field (deprecated)
-- 4. Ensure permanent_district field exists
-- =============================================================================

USE regapp_db;

-- =============================================================================
-- ADD MISSING FIELDS FOR GRANULAR SAVE FUNCTIONALITY
-- =============================================================================

-- Add missing contact fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20) NULL AFTER phone;

-- Add district field for current address
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS district VARCHAR(255) NULL AFTER state;

-- Add permanent address fields (one by one to avoid syntax issues)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_address_line1 VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_address_line2 VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_city VARCHAR(100) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_district VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_state VARCHAR(100) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_country VARCHAR(100) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permanent_pin_code VARCHAR(10) NULL;

-- Add same_as_current_address field
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS same_as_current_address BOOLEAN DEFAULT FALSE;

-- Add kulam-related fields for granular save functionality (one by one)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kulam VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kulam_other VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kula_deivam VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kula_deivam_other VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kaani VARCHAR(255) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS kaani_other VARCHAR(255) NULL;

-- =============================================================================
-- REMOVE DEPRECATED FIELDS
-- =============================================================================

-- Remove post_office_area field if it exists (deprecated - not needed per requirements)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'user_profiles' 
     AND COLUMN_NAME = 'post_office_area' 
     AND TABLE_SCHEMA = DATABASE()) > 0,
    'ALTER TABLE user_profiles DROP COLUMN post_office_area',
    'SELECT "post_office_area column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================================================

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_district ON user_profiles(district);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pin_code ON user_profiles(pin_code);

-- Add indexes for permanent address fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_permanent_district ON user_profiles(permanent_district);
CREATE INDEX IF NOT EXISTS idx_user_profiles_permanent_state ON user_profiles(permanent_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_permanent_country ON user_profiles(permanent_country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_permanent_pin_code ON user_profiles(permanent_pin_code);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show current user_profiles table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'user_profiles' 
AND TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME LIKE '%address%' 
   OR COLUMN_NAME LIKE '%city%' 
   OR COLUMN_NAME LIKE '%district%' 
   OR COLUMN_NAME LIKE '%state%' 
   OR COLUMN_NAME LIKE '%country%' 
   OR COLUMN_NAME LIKE '%pin_code%'
ORDER BY ORDINAL_POSITION;

-- =============================================================================
-- MIGRATION COMPLETION LOG
-- =============================================================================

INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address) 
VALUES (
    1,
    'SCHEMA_UPDATE', 
    'user', 
    NULL,
    JSON_OBJECT(
        'migration_name', 'address_fields_update',
        'changes', JSON_ARRAY(
            'Added district field',
            'Added permanent address fields',
            'Removed post_office_area field',
            'Added performance indexes'
        ),
        'timestamp', NOW()
    ),
    'SYSTEM'
) ON DUPLICATE KEY UPDATE id=id;

-- =============================================================================
-- NOTES
-- =============================================================================

/*
ADDRESS FIELD MAPPING:
=====================

CURRENT ADDRESS:
- address_line1: "Door No., Road/Street"
- address_line2: "Area Name, Land Mark/Post Office"  
- city: "City/Taluk"
- district: District dropdown
- state: State dropdown  
- country: Country dropdown
- pin_code: 6-digit postal code

PERMANENT ADDRESS:
- permanent_address_line1: "Door No., Road/Street"
- permanent_address_line2: "Area Name, Land Mark/Post Office"
- permanent_city: "City/Taluk"
- permanent_district: District dropdown
- permanent_state: State dropdown
- permanent_country: Country dropdown  
- permanent_pin_code: 6-digit postal code

REMOVED FIELDS:
- post_office_area: No longer required per updated requirements

ORDER IN FORM:
- Address Line 1, Address Line 2, City/Taluk, District, State, Country, PIN Code
*/
