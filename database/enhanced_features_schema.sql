-- =============================================================================
-- ENHANCED FEATURES DATABASE SCHEMA
-- Version: 1.0
-- Created: 2025-01-27
-- Description: Database schema for Groups, Announcements, Events, and Ask Help features
-- =============================================================================

USE regapp_db;

-- =============================================================================
-- GROUPS FEATURE TABLES
-- =============================================================================

-- Groups table - stores group definitions
CREATE TABLE IF NOT EXISTS groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('district', 'area', 'custom') NOT NULL,
    district VARCHAR(255) NULL,
    area VARCHAR(255) NULL,
    pin_code VARCHAR(10) NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id),
    INDEX idx_type (type),
    INDEX idx_district (district),
    INDEX idx_area (area),
    INDEX idx_pin_code (pin_code)
);

-- Group members table - tracks which users belong to which groups
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id),
    UNIQUE KEY unique_group_user (group_id, user_id),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id)
);

-- =============================================================================
-- ANNOUNCEMENTS FEATURE TABLES
-- =============================================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    target_groups JSON NULL, -- Array of group IDs this announcement targets
    attachments JSON NULL, -- Array of attachment file paths
    images JSON NULL, -- Array of image file paths
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_created_by (created_by),
    INDEX idx_pinned (is_pinned),
    INDEX idx_archived (is_archived),
    INDEX idx_created_at (created_at)
);

-- Announcement likes
CREATE TABLE IF NOT EXISTS announcement_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_user_like (announcement_id, user_id),
    INDEX idx_announcement (announcement_id)
);

-- Announcement comments
CREATE TABLE IF NOT EXISTS announcement_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT NULL, -- For replies
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES announcement_comments(id) ON DELETE CASCADE,
    INDEX idx_announcement (announcement_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_created_at (created_at)
);

-- Announcement views tracking
CREATE TABLE IF NOT EXISTS announcement_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_user_view (announcement_id, user_id),
    INDEX idx_announcement (announcement_id)
);

-- =============================================================================
-- EVENTS FEATURE TABLES
-- =============================================================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255),
    created_by INT NOT NULL,
    target_groups JSON NULL, -- Array of group IDs this event targets
    attachments JSON NULL, -- Array of attachment file paths
    images JSON NULL, -- Array of image file paths
    max_attendees INT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_created_by (created_by),
    INDEX idx_event_date (event_date),
    INDEX idx_created_at (created_at)
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('attending', 'not_attending', 'maybe') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user_rsvp (event_id, user_id),
    INDEX idx_event (event_id),
    INDEX idx_status (status)
);

-- Event views tracking
CREATE TABLE IF NOT EXISTS event_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user_view (event_id, user_id),
    INDEX idx_event (event_id)
);

-- =============================================================================
-- ASK HELP FEATURE TABLES
-- =============================================================================

-- Help posts table
CREATE TABLE IF NOT EXISTS help_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NULL,
    created_by INT NOT NULL,
    target_audience ENUM('public', 'groups', 'area', 'district', 'institution', 'company') NOT NULL,
    target_groups JSON NULL, -- Array of group IDs if target is groups
    target_area VARCHAR(255) NULL,
    target_district VARCHAR(255) NULL,
    target_institution VARCHAR(255) NULL,
    target_company VARCHAR(255) NULL,
    attachments JSON NULL, -- Array of attachment file paths
    images JSON NULL, -- Array of image file paths
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES admin_users(id),
    INDEX idx_created_by (created_by),
    INDEX idx_approval_status (approval_status),
    INDEX idx_target_audience (target_audience),
    INDEX idx_pinned (is_pinned),
    INDEX idx_created_at (created_at)
);

-- Help post likes
CREATE TABLE IF NOT EXISTS help_post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    help_post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (help_post_id) REFERENCES help_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_help_post_user_like (help_post_id, user_id),
    INDEX idx_help_post (help_post_id)
);

-- Help post comments
CREATE TABLE IF NOT EXISTS help_post_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    help_post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT NULL, -- For replies
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (help_post_id) REFERENCES help_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES help_post_comments(id) ON DELETE CASCADE,
    INDEX idx_help_post (help_post_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_created_at (created_at)
);

-- Help post views tracking
CREATE TABLE IF NOT EXISTS help_post_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    help_post_id INT NOT NULL,
    user_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (help_post_id) REFERENCES help_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_help_post_user_view (help_post_id, user_id),
    INDEX idx_help_post (help_post_id)
);

-- =============================================================================
-- ENHANCED USER PROFILES TABLE UPDATES
-- =============================================================================

-- Add district and post office area to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS district VARCHAR(255) NULL AFTER state,
ADD COLUMN IF NOT EXISTS post_office_area VARCHAR(255) NULL AFTER district;

-- =============================================================================
-- DISTRICTS AND POST OFFICES DATA TABLES
-- =============================================================================

-- Districts table for India
CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(100) NOT NULL,
    district_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_state_district (state, district_name),
    INDEX idx_state (state)
);

-- Post offices table for PIN code based areas
CREATE TABLE IF NOT EXISTS post_offices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pin_code VARCHAR(10) NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    office_type VARCHAR(50),
    district VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pin_office (pin_code, office_name),
    INDEX idx_pin_code (pin_code),
    INDEX idx_district (district),
    INDEX idx_state (state)
);

-- =============================================================================
-- FILE UPLOADS TABLE
-- =============================================================================

-- Files table for managing uploads
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by INT NOT NULL,
    upload_type ENUM('announcement', 'event', 'help_post', 'profile') NOT NULL,
    reference_id INT NULL, -- ID of the related record
    is_image BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_upload_type (upload_type),
    INDEX idx_reference (reference_id),
    INDEX idx_uploaded_by (uploaded_by)
);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

-- Notifications for user activities
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('announcement', 'event', 'help_post', 'comment', 'like', 'group_added', 'approval') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL, -- announcement, event, help_post, etc.
    reference_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_read (is_read),
    INDEX idx_created_at (created_at)
);

-- =============================================================================
-- INSERT SAMPLE DISTRICTS DATA
-- =============================================================================

-- Insert sample districts for major states (you can expand this list)
INSERT IGNORE INTO districts (state, district_name) VALUES
-- Tamil Nadu
('Tamil Nadu', 'Chennai'),
('Tamil Nadu', 'Coimbatore'),
('Tamil Nadu', 'Madurai'),
('Tamil Nadu', 'Salem'),
('Tamil Nadu', 'Tiruchirappalli'),
('Tamil Nadu', 'Tiruppur'),
('Tamil Nadu', 'Vellore'),
('Tamil Nadu', 'Erode'),
('Tamil Nadu', 'Thanjavur'),
('Tamil Nadu', 'Dindigul'),

-- Karnataka
('Karnataka', 'Bengaluru Urban'),
('Karnataka', 'Bengaluru Rural'),
('Karnataka', 'Mysuru'),
('Karnataka', 'Hubballi-Dharwad'),
('Karnataka', 'Mangaluru'),
('Karnataka', 'Belagavi'),
('Karnataka', 'Kalaburagi'),
('Karnataka', 'Davangere'),
('Karnataka', 'Ballari'),
('Karnataka', 'Vijayapura'),

-- Kerala
('Kerala', 'Thiruvananthapuram'),
('Kerala', 'Kochi'),
('Kerala', 'Kozhikode'),
('Kerala', 'Kollam'),
('Kerala', 'Thrissur'),
('Kerala', 'Alappuzha'),
('Kerala', 'Kottayam'),
('Kerala', 'Kannur'),
('Kerala', 'Kasaragod'),
('Kerala', 'Wayanad'),

-- Andhra Pradesh
('Andhra Pradesh', 'Visakhapatnam'),
('Andhra Pradesh', 'Vijayawada'),
('Andhra Pradesh', 'Guntur'),
('Andhra Pradesh', 'Nellore'),
('Andhra Pradesh', 'Kurnool'),
('Andhra Pradesh', 'Rajahmundry'),
('Andhra Pradesh', 'Tirupati'),
('Andhra Pradesh', 'Kakinada'),
('Andhra Pradesh', 'Anantapur'),
('Andhra Pradesh', 'Chittoor');

-- =============================================================================
-- INSERT SAMPLE POST OFFICES DATA
-- =============================================================================

-- Insert sample post offices (you can expand this list with real data)
INSERT IGNORE INTO post_offices (pin_code, office_name, office_type, district, state) VALUES
-- Chennai
('600001', 'Fort', 'Head Office', 'Chennai', 'Tamil Nadu'),
('600002', 'Anna Salai', 'Sub Office', 'Chennai', 'Tamil Nadu'),
('600003', 'Triplicane', 'Sub Office', 'Chennai', 'Tamil Nadu'),
('600004', 'Mylapore', 'Sub Office', 'Chennai', 'Tamil Nadu'),
('600005', 'T. Nagar', 'Sub Office', 'Chennai', 'Tamil Nadu'),

-- Bengaluru
('560001', 'Bengaluru GPO', 'Head Office', 'Bengaluru Urban', 'Karnataka'),
('560002', 'Bangalore Cantonment', 'Sub Office', 'Bengaluru Urban', 'Karnataka'),
('560003', 'Malleshwaram', 'Sub Office', 'Bengaluru Urban', 'Karnataka'),
('560004', 'Basavanagudi', 'Sub Office', 'Bengaluru Urban', 'Karnataka'),
('560005', 'Rajajinagar', 'Sub Office', 'Bengaluru Urban', 'Karnataka'),

-- Thiruvananthapuram
('695001', 'Thiruvananthapuram GPO', 'Head Office', 'Thiruvananthapuram', 'Kerala'),
('695002', 'Statue', 'Sub Office', 'Thiruvananthapuram', 'Kerala'),
('695003', 'Vazhuthacaud', 'Sub Office', 'Thiruvananthapuram', 'Kerala'),
('695004', 'Chalai', 'Sub Office', 'Thiruvananthapuram', 'Kerala'),
('695005', 'Thampanoor', 'Sub Office', 'Thiruvananthapuram', 'Kerala');

COMMIT;
