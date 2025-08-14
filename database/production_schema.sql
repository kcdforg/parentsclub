-- =============================================================================
-- PRODUCTION SCHEMA FOR REGISTRATION PORTAL
-- Version: 2.0 - Minimal Current Requirements
-- Description: Essential tables only for current application functionality
-- =============================================================================

-- Create main database
CREATE DATABASE IF NOT EXISTS regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE regapp_db;

-- =============================================================================
-- ESSENTIAL TABLES (Current Application Requirements)
-- =============================================================================

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Public users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(20) UNIQUE,
    user_number INT UNIQUE,
    referred_by_type ENUM('admin', 'user') DEFAULT NULL,
    referred_by_id INT DEFAULT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invitation_code VARCHAR(64) UNIQUE NOT NULL,
    invited_name VARCHAR(100) NOT NULL,
    invited_email VARCHAR(100) NOT NULL,
    invited_by_type ENUM('admin', 'user') NOT NULL,
    invited_by_id INT NOT NULL,
    status ENUM('pending', 'used', 'expired') DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    used_by INT NULL,
    FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_type VARCHAR(50) NOT NULL DEFAULT 'annual',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_type ENUM('admin', 'user') NOT NULL,
    user_id INT NOT NULL,
    data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ESSENTIAL INDEXES
-- =============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_enrollment ON users(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_users_approval ON users(approval_status);

-- Invitation indexes
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invited_email);

-- Session index
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO admin_users (username, password, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com');

-- =============================================================================
-- NOTES
-- =============================================================================

/*
PRODUCTION SCHEMA FEATURES:
===========================

1. MINIMAL & CLEAN:
   - Only tables currently used by application
   - No experimental or future features
   - Fast execution and setup

2. SAFETY FEATURES:
   - IF NOT EXISTS prevents errors on re-run
   - INSERT IGNORE prevents duplicate admin user
   - Proper character set for international support

3. PERFORMANCE:
   - Essential indexes only
   - Optimized for current usage patterns

4. COMPATIBILITY:
   - 100% compatible with current application
   - No breaking changes
   - Supports all existing functionality
*/
