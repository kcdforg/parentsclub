-- Feature Switches Table
-- Allows admins to dynamically enable/disable features across the platform

CREATE TABLE IF NOT EXISTS feature_switches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    feature_key VARCHAR(50) UNIQUE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by_admin INT,
    FOREIGN KEY (updated_by_admin) REFERENCES admin_users(id)
);

-- Insert default feature switches
INSERT IGNORE INTO feature_switches (feature_key, feature_name, description, is_enabled, category) VALUES
('subscriptions', 'Subscriptions', 'Enable/disable subscription features for public users including subscription page, payment processing, and related functionality', TRUE, 'user_features'),
('user_invitations', 'User Invitations', 'Allow approved users to create and send invitations to new members', TRUE, 'user_features'),
('user_profiles', 'User Profiles', 'Enable user profile editing and management features', TRUE, 'user_features'),
('password_reset', 'Password Reset', 'Enable password reset functionality for users', TRUE, 'security'),
('user_registration', 'User Registration', 'Allow new user registration (when disabled, only admin-created accounts work)', TRUE, 'security');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_switches_key ON feature_switches(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_switches_enabled ON feature_switches(is_enabled);
