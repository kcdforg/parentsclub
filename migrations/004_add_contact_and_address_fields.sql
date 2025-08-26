-- =============================================================================
-- MIGRATION 004: ADD CONTACT AND ADDRESS FIELDS
-- Date: 2025-01-11
-- Purpose: Add new fields for Tasks 1-7 implementation
-- =============================================================================

-- Add secondary phone field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN secondary_phone VARCHAR(20) NULL AFTER phone,
ADD COLUMN secondary_country_code VARCHAR(5) DEFAULT '+91' AFTER secondary_phone;

-- Add permanent address fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN permanent_address_line1 VARCHAR(255) NULL,
ADD COLUMN permanent_address_line2 VARCHAR(255) NULL,
ADD COLUMN permanent_city VARCHAR(100) NULL,
ADD COLUMN permanent_state VARCHAR(100) NULL,
ADD COLUMN permanent_country VARCHAR(100) NULL,
ADD COLUMN permanent_pin_code VARCHAR(10) NULL,
ADD COLUMN same_as_current_address BOOLEAN DEFAULT FALSE;

-- Add current address fields (breaking down existing address field)
ALTER TABLE user_profiles 
ADD COLUMN address_line1 VARCHAR(255) NULL,
ADD COLUMN address_line2 VARCHAR(255) NULL,
ADD COLUMN city VARCHAR(100) NULL,
ADD COLUMN state VARCHAR(100) NULL,
ADD COLUMN country VARCHAR(100) NULL;

-- Modify existing address field name for backward compatibility
ALTER TABLE user_profiles 
CHANGE COLUMN address current_address_combined TEXT NULL;

-- Add pin_code alias for consistency (pin_code already exists)
-- ALTER TABLE user_profiles ADD COLUMN pin_code VARCHAR(10) NULL; -- Already exists

-- Update phone column sizes to handle international numbers with country codes
ALTER TABLE user_profiles MODIFY COLUMN phone VARCHAR(20);

-- Add indexes for performance
CREATE INDEX idx_user_profiles_secondary_phone ON user_profiles(secondary_phone);
CREATE INDEX idx_user_profiles_permanent_city ON user_profiles(permanent_city);
CREATE INDEX idx_user_profiles_city ON user_profiles(city);

-- =============================================================================
-- COMMENTS FOR FIELD USAGE:
-- =============================================================================
-- secondary_phone: Optional second phone number for the user
-- secondary_country_code: Country code for secondary phone
-- permanent_address_*: Permanent address fields (can be same as current)
-- same_as_current_address: Boolean flag if permanent address is same as current
-- address_line1/2: Current address broken down into structured fields
-- city, state, country: Current address location details
-- current_address_combined: Maintains backward compatibility with old address field
-- =============================================================================
