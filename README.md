# Registration Portal

A comprehensive web application with user registration, profile management, admin dashboard, and referral system built with modern web technologies.

## 🚀 Features

### Admin Features
- **Admin Dashboard**: Complete overview with statistics and recent activity
- **User Management**: Approve/reject users, view profiles, manage subscriptions
- **Invitation System**: Generate invitation links for new users
- **Admin User Management**: Add/remove admin users, change passwords
- **Secure Authentication**: Session-based authentication with proper security

### Public User Features
- **Registration**: Account creation with invitation support
- **Profile Management**: Complete profile with personal details
- **Approval System**: Admin approval workflow for new users
- **Subscription Management**: Annual membership with placeholder payment integration
- **Referral System**: Users can invite others and track referrals
- **Account Settings**: Change password, view account information

### Technical Features
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **API-based Architecture**: RESTful APIs with JSON communication
- **Session Management**: Secure session handling with database storage
- **Input Validation**: Client-side and server-side validation
- **Security**: Password hashing, SQL injection prevention, XSS protection

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Vanilla JavaScript**: Modern ES6+ JavaScript with fetch API
- **Font Awesome**: Icon library for UI elements

### Backend
- **PHP 7.4+**: Server-side programming with modern OOP practices
- **MySQL 8.0+**: Relational database with normalized schema
- **PDO**: Prepared statements for database security
- **Session Management**: Custom session handling with database storage

## 📁 Project Structure

```
regapp2/
├── admin/                          # Admin panel (separate subdomain)
│   ├── backend/                    # Admin API endpoints
│   │   ├── login.php              # Admin authentication
│   │   ├── dashboard.php          # Dashboard data
│   │   ├── users.php              # User management
│   │   ├── invitations.php        # Invitation management
│   │   ├── admin_users.php        # Admin user management
│   │   └── logout.php             # Logout functionality
│   └── frontend/                   # Admin UI
│       ├── login.html             # Admin login page
│       ├── dashboard.html         # Admin dashboard
│       └── js/                    # JavaScript files
│           ├── login.js
│           └── dashboard.js
├── public/                         # Public user interface
│   ├── backend/                    # Public API endpoints
│   │   ├── register.php           # User registration
│   │   ├── login.php              # User authentication
│   │   ├── profile.php            # Profile management
│   │   ├── account.php            # Account settings
│   │   ├── subscription.php       # Subscription management
│   │   ├── referral.php           # Referral system
│   │   ├── invitation.php         # Invitation validation
│   │   └── logout.php             # Logout functionality
│   └── frontend/                   # Public UI
│       ├── index.html             # Landing page
│       ├── register.html          # Registration page
│       ├── login.html             # Login page
│       ├── profile.html           # Profile completion
│       ├── dashboard.html         # User dashboard
│       └── js/                    # JavaScript files
│           ├── register.js
│           ├── login.js
│           └── dashboard.js
├── config/                         # Configuration files
│   ├── database.php               # Database connection
│   └── session.php                # Session management
├── database/                       # Database files
│   └── schema.sql                 # Database schema
└── README.md                      # This file
```

## 🔧 Installation & Setup

### Prerequisites
- **Web Server**: Apache/Nginx with PHP support
- **PHP 7.4+**: With PDO and MySQL extensions
- **MySQL 8.0+**: Database server
- **XAMPP/WAMP/LAMP**: For local development

### Installation Steps

1. **Clone or Download**
   ```bash
   # Place the files in your web server directory
   # For XAMPP: C:\xampp\htdocs\regapp2\
   ```

2. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE regapp_db;
   
   -- Import schema
   mysql -u root -p regapp_db < database/schema.sql
   ```

3. **Configure Database**
   ```php
   // Edit config/database.php
   private $host = 'localhost';
   private $dbname = 'regapp_db';
   private $username = 'root';        // Your MySQL username
   private $password = '';            // Your MySQL password
   ```

4. **Web Server Configuration**
   
   **For Admin Subdomain (Optional):**
   ```apache
   # Add to your hosts file (for local development)
   127.0.0.1 admin.regapp.local
   
   # Apache VirtualHost
   <VirtualHost *:80>
       DocumentRoot "C:/xampp/htdocs/regapp2/admin/frontend"
       ServerName admin.regapp.local
   </VirtualHost>
   ```

5. **File Permissions**
   ```bash
   # Ensure web server can read/write
   chmod -R 755 regapp2/
   ```

### Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

## 🌐 Usage

### Admin Access
1. Navigate to `http://localhost/regapp2/admin/frontend/login.html`
2. Login with default credentials
3. Access dashboard to manage users and create invitations

### User Registration
1. Navigate to `http://localhost/regapp2/public/frontend/index.html`
2. Click "Get Started" to register
3. Complete profile after registration
4. Wait for admin approval

### User Dashboard
- After approval, users can access their dashboard
- Manage profile, view subscription status
- Create referral invitations for others

## 📡 API Endpoints

### Admin APIs
- `POST /admin/backend/login.php` - Admin login
- `GET /admin/backend/dashboard.php` - Dashboard data
- `GET|PUT|DELETE /admin/backend/users.php` - User management
- `GET|POST /admin/backend/invitations.php` - Invitation management
- `GET|POST|PUT|DELETE /admin/backend/admin_users.php` - Admin user management

### Public APIs
- `POST /public/backend/register.php` - User registration
- `POST /public/backend/login.php` - User login
- `GET|POST|PUT /public/backend/profile.php` - Profile management
- `GET|PUT /public/backend/account.php` - Account settings
- `GET|POST /public/backend/subscription.php` - Subscription management
- `GET|POST /public/backend/referral.php` - Referral system
- `GET /public/backend/invitation.php` - Invitation validation

## 🔒 Security Features

- **Password Hashing**: Using PHP's `password_hash()` with bcrypt
- **SQL Injection Prevention**: PDO prepared statements
- **XSS Protection**: Input sanitization and output encoding
- **Session Security**: Secure session management with database storage
- **CSRF Protection**: Token-based protection (implement as needed)
- **Input Validation**: Client-side and server-side validation
- **Email Validation**: Proper email format validation

## 🎨 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl responsive breakpoints
- **Touch-Friendly**: Large tap targets and gesture support
- **Cross-Browser**: Compatible with modern browsers
- **Accessibility**: ARIA labels and keyboard navigation

## 🚀 Production Deployment

### Security Checklist
- [ ] Change default admin password
- [ ] Update database credentials
- [ ] Enable HTTPS
- [ ] Configure proper file permissions
- [ ] Enable error logging (disable display_errors)
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Configure backup strategy

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Minify CSS/JS files
- [ ] Enable browser caching
- [ ] Use CDN for static assets

## 🛠 Customization

### Adding New Features
1. Create API endpoints in appropriate backend folder
2. Add frontend components with responsive design
3. Update database schema if needed
4. Add proper validation and security measures

### Styling Customization
- Modify Tailwind CSS classes in HTML files
- Add custom CSS if needed
- Update color scheme in the design system

### Database Schema Modifications
1. Create migration scripts
2. Update API endpoints
3. Modify frontend to handle new fields

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
- Check database credentials in `config/database.php`
- Ensure MySQL service is running
- Verify database exists and has proper permissions

**Session Issues:**
- Check file permissions for session storage
- Verify database session table exists
- Clear browser storage if needed

**API Errors:**
- Check PHP error logs
- Verify API endpoints are accessible
- Test with proper HTTP methods

**UI Issues:**
- Check browser console for JavaScript errors
- Verify Tailwind CSS is loading
- Test responsive design on different devices

## 📝 License

This project is developed for educational and demonstration purposes. Please review and implement additional security measures before using in production.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with proper testing
4. Submit pull request with detailed description

## 📞 Support

For issues and questions:
- Check troubleshooting section
- Review API documentation
- Test with provided default credentials
- Verify database schema is properly imported

---

**Note**: This is a demonstration application. Please implement additional security measures, error handling, and testing before using in a production environment.
