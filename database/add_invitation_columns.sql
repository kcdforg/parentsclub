-- Add missing invitation-related columns to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_via_invitation BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_id INT NULL;

-- Add index for invitation_id
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_invitation_id (invitation_id);

-- Add foreign key constraint if invitations table exists
-- (We'll add this separately to avoid errors if invitations table structure is different)

-- Update existing users who were created via invitation
-- Based on the user_type field, we can infer which users were created via invitation
UPDATE users SET created_via_invitation = TRUE WHERE user_type = 'invited';
