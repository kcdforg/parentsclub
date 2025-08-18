-- =============================================================================
-- UPDATE INVITATIONS TABLE SCHEMA
-- Adds invitee_number field and updates status enum
-- =============================================================================

USE regapp_db;

-- Add invitee_number field to invitations table
ALTER TABLE invitations 
ADD COLUMN invitee_number VARCHAR(20) UNIQUE AFTER id;

-- Update status enum to include new statuses
ALTER TABLE invitations 
MODIFY COLUMN status ENUM('open', 'accepted', 'expired') DEFAULT 'open';

-- Add index for invitee_number for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_number ON invitations(invitee_number);

-- Add resent_at field to track when invitations are resent
ALTER TABLE invitations 
ADD COLUMN resent_at TIMESTAMP NULL AFTER used_at;

-- Update existing invitations to have invitee numbers
-- This will generate INV-0000001, INV-0000002, etc. for existing records
SET @row_number = 0;
UPDATE invitations 
SET invitee_number = CONCAT('INV-', LPAD((@row_number := @row_number + 1), 7, '0'))
WHERE invitee_number IS NULL
ORDER BY id;

-- Update existing status values
-- 'pending' becomes 'open'
-- 'used' becomes 'accepted'
-- 'expired' remains 'expired'
UPDATE invitations SET status = 'open' WHERE status = 'pending';
UPDATE invitations SET status = 'accepted' WHERE status = 'used';

-- Set used_at to accepted_at for clarity (rename conceptually)
-- The used_at field will now represent when the invitation was accepted

COMMIT;
