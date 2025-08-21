-- Add missing name columns to user_profiles table

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS second_name VARCHAR(100) NULL;
