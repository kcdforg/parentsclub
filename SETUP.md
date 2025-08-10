# Quick Setup Guide

This guide will help you get the Registration Portal up and running quickly.

## 📋 Prerequisites

- **XAMPP/WAMP/LAMP** (or any PHP-enabled web server)
- **PHP 7.4+** with PDO and MySQL extensions
- **MySQL 8.0+** database server
- Modern web browser

## 🚀 Quick Start (5 minutes)

### Step 1: Download and Extract
1. Place the `regapp2` folder in your web server directory:
   - **XAMPP**: `C:\xampp\htdocs\regapp2\`
   - **Linux**: `/var/www/html/regapp2/`
   - **macOS**: `/Applications/XAMPP/htdocs/regapp2/`

### Step 2: Database Setup
1. Start your MySQL server (through XAMPP Control Panel or command line)
2. Open phpMyAdmin or MySQL command line
3. Create database:
   ```sql
   CREATE DATABASE regapp_db;
   ```
4. Import the schema:
   ```sql
   USE regapp_db;
   SOURCE C:/xampp/htdocs/regapp2/database/schema.sql;
   ```
   
   **Or through phpMyAdmin:**
   - Select `regapp_db` database
   - Go to Import tab
   - Choose `database/schema.sql` file
   - Click Go

### Step 3: Configuration
1. Edit `config/database.php` if needed:
   ```php
   private $host = 'localhost';
   private $dbname = 'regapp_db';
   private $username = 'root';     // Your MySQL username
   private $password = '';         // Your MySQL password (empty for XAMPP)
   ```

### Step 4: Access the Application

**Public Portal:**
- Home: `http://localhost/regapp2/public/frontend/index.html`
- Register: `http://localhost/regapp2/public/frontend/register.html`
- Login: `http://localhost/regapp2/public/frontend/login.html`

**Admin Portal:**
- Login: `http://localhost/regapp2/admin/frontend/login.html`
- Username: `admin`
- Password: `admin123`

## 🔧 File Structure Overview

```
regapp2/
├── admin/                  # Admin panel
│   ├── backend/           # Admin APIs
│   └── frontend/          # Admin UI
├── public/                # Public portal
│   ├── backend/           # Public APIs
│   └── frontend/          # Public UI
├── config/                # Configuration
├── database/              # Database files
└── README.md             # Full documentation
```

## 🎯 Testing the Application

### Test Admin Functions:
1. Login to admin panel with `admin/admin123`
2. Create an invitation from dashboard
3. View and manage users
4. Approve/reject user registrations

### Test Public Functions:
1. Register a new user (with or without invitation)
2. Complete profile information
3. Login and access user dashboard
4. Create referral invitations

## 🛠 Common Issues & Solutions

### Database Connection Error
```
Error: Could not connect to database
```
**Solution:**
- Check if MySQL is running
- Verify database credentials in `config/database.php`
- Ensure `regapp_db` database exists

### 404 Errors on API Calls
```
Error: API endpoint not found
```
**Solution:**
- Check file permissions (755 for directories, 644 for files)
- Ensure `.htaccess` allows PHP execution
- Verify PHP is working: create `<?php phpinfo(); ?>` file

### Session Issues
```
Error: Invalid or expired session
```
**Solution:**
- Clear browser localStorage
- Check if sessions table exists in database
- Restart web server

### Permission Denied
```
Error: Permission denied
```
**Solution:**
```bash
# Linux/macOS
chmod -R 755 regapp2/
chown -R www-data:www-data regapp2/

# Windows - Run as Administrator
```

## 📱 Testing Responsive Design

Test the application on different screen sizes:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

**Chrome DevTools:**
1. Press F12
2. Click device toolbar icon
3. Test different device presets

## 🔒 Security Notes

### Change Default Password
**Important:** Change the default admin password immediately:
1. Login to admin panel
2. Click user menu → Change Password
3. Set a strong password

### Production Security
Before going live:
- [ ] Change database credentials
- [ ] Enable HTTPS
- [ ] Configure proper file permissions
- [ ] Enable error logging (disable display_errors)
- [ ] Add rate limiting
- [ ] Implement CSRF protection

## 📞 Getting Help

### Check These First:
1. **Browser Console**: Press F12 → Console tab for JavaScript errors
2. **PHP Error Logs**: Check `xampp/php/logs/php_error_log`
3. **Database**: Verify all tables are created properly
4. **File Permissions**: Ensure web server can read files

### Test Checklist:
- [ ] Database connection working
- [ ] Admin login successful
- [ ] User registration working
- [ ] Profile completion working
- [ ] Invitation system working
- [ ] Responsive design working on mobile

### API Testing:
Use browser network tab (F12 → Network) to check:
- API responses are JSON
- HTTP status codes (200 = success, 400 = client error, 500 = server error)
- Request/response data

## 🚀 Next Steps

After setup:
1. **Customize**: Modify colors, branding, content
2. **Extend**: Add new features based on requirements
3. **Deploy**: Move to production server with security measures
4. **Monitor**: Set up logging and monitoring

## 📋 Default Test Data

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Test User Registration:**
1. Use admin panel to create invitation
2. Register with invitation link
3. Complete profile
4. Test approval workflow

---

**Need more help?** Check the full `README.md` for detailed documentation.
