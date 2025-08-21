-- Add phone and email columns to spouse_details table
USE regapp_db;

ALTER TABLE spouse_details 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER date_of_birth,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER phone;

-- Also update gender enum to include 'others' option
ALTER TABLE spouse_details 
MODIFY COLUMN gender ENUM('male', 'female', 'others') NOT NULL;
