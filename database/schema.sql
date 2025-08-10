-- Database Schema for Registration Portal
-- Create database first: CREATE DATABASE regapp_db;

-- Admin users table
CREATE TABLE admin_users (
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
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(20) UNIQUE,
    user_number INT UNIQUE,
    referred_by_type ENUM('admin', 'user') DEFAULT NULL,
    referred_by_id INT DEFAULT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- User profiles table
CREATE TABLE user_profiles (
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
CREATE TABLE invitations (
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
CREATE TABLE subscriptions (
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

-- Sessions table for session management
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_type ENUM('admin', 'user') NOT NULL,
    user_id INT NOT NULL,
    data TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO admin_users (username, password, email) VALUES 
('admin', '21232f297a57a5a743894a0e4a801fc3', 'admin@example.com'); -- password: admin123 (MD5 hash)

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_enrollment ON users(enrollment_number);
CREATE INDEX idx_users_approval ON users(approval_status);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_email ON invitations(invited_email);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
