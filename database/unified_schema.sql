-- =============================================================================
-- UNIFIED DATABASE SCHEMA FOR REGISTRATION PORTAL
-- Version: 2.0
-- Created: 2025-01-11
-- Description: Consolidated schema from schema.sql, complete_schema.sql, and setup_database.sql
-- =============================================================================

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create main database
CREATE DATABASE IF NOT EXISTS regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE regapp_db;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Admin users table (Enhanced with additional fields from complete_schema.sql)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Public users table (Enhanced with phone support)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    password VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(20) UNIQUE,
    user_number INT UNIQUE,
    referred_by_type ENUM('admin', 'user') DEFAULT NULL,
    referred_by_id INT DEFAULT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    user_type ENUM('invited', 'registered', 'enrolled', 'approved', 'premium') DEFAULT 'invited',
    profile_completed BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(64),
    phone_verification_token VARCHAR(64),
    password_reset_token VARCHAR(64),
    password_reset_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INT,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    -- Ensure either email or phone is provided
    CHECK (email IS NOT NULL OR phone IS NOT NULL),
    FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- User profiles table (Enhanced with emergency contact fields)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invitations table (Enhanced with phone support)
CREATE TABLE IF NOT EXISTS invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invitation_code VARCHAR(64) UNIQUE NOT NULL,
    invited_name VARCHAR(100) NOT NULL,
    invited_email VARCHAR(100),
    invited_phone VARCHAR(15),
    invited_by_type ENUM('admin', 'user') NOT NULL,
    invited_by_id INT NOT NULL,
    status ENUM('pending', 'used', 'expired') DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    used_by INT NULL,
    notes TEXT,
    -- Ensure either email or phone is provided
    CHECK (invited_email IS NOT NULL OR invited_phone IS NOT NULL),
    FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Subscriptions table (Enhanced with additional fields)
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_type VARCHAR(50) NOT NULL DEFAULT 'annual',
    status ENUM('active', 'inactive', 'pending', 'expired', 'cancelled') DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_admin INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_admin) REFERENCES admin_users(id)
);

-- Sessions table (Current legacy format for backward compatibility)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_type ENUM('admin', 'user') NOT NULL,
    user_id INT NOT NULL,
    data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FUTURE ENHANCEMENT TABLES (From complete_schema.sql)
-- =============================================================================

-- Admin sessions (separate from user sessions for better security)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(128) PRIMARY KEY,
    admin_id INT NOT NULL,
    data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- User sessions (separate from admin sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin activity log (for audit trail)
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type ENUM('user', 'invitation', 'subscription', 'admin') NOT NULL,
    target_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Admin table indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_enrollment ON users(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_users_user_number ON users(user_number);
CREATE INDEX IF NOT EXISTS idx_users_approval ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Invitation indexes
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON invitations(invited_phone);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Legacy session index
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default admin user (password: admin123)
-- Uses INSERT IGNORE to avoid errors if admin already exists
INSERT IGNORE INTO admin_users (username, password, email, full_name, role) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'System Administrator', 'super_admin');

-- =============================================================================
-- DATABASE CONFIGURATION NOTES
-- =============================================================================

/*
SCHEMA UNIFICATION NOTES:
=========================

1. SOURCES MERGED:
   - database/schema.sql (base schema)
   - database/complete_schema.sql (enhanced with future features)
   - setup_database.sql (simplified setup version)

2. ENHANCEMENTS ADDED:
   - All tables use IF NOT EXISTS for safe execution
   - Additional fields for future functionality
   - Better indexing strategy
   - Separate admin/user session tables
   - Admin activity logging
   - Enhanced subscription tracking

3. BACKWARD COMPATIBILITY:
   - Legacy 'sessions' table maintained
   - All existing foreign keys preserved
   - No breaking changes to current application

4. SAFETY FEATURES:
   - INSERT IGNORE for default data
   - Proper character set (utf8mb4)
   - Foreign key constraints
   - Proper indexing for performance

5. FUTURE MIGRATION PATH:
   - Enhanced tables ready for advanced features
   - Session separation prepared
   - Admin audit trail ready
   - Database separation structure prepared
*/
