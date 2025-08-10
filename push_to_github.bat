@echo off
echo ?? Pushing Registration Portal to GitHub...
echo.

rem Initialize git repository
echo Initializing Git repository...
git init

rem Add remote repository
echo Adding remote repository...
git remote add origin https://github.com/d299techie/Onboard2.git 2>nul

rem Create .gitignore file
echo Creating .gitignore file...
echo # Logs > .gitignore
echo *.log >> .gitignore
echo npm-debug.log* >> .gitignore
echo yarn-debug.log* >> .gitignore
echo yarn-error.log* >> .gitignore
echo. >> .gitignore
echo # IDE and Editor files >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo *.swp >> .gitignore
echo *.swo >> .gitignore
echo *~ >> .gitignore
echo. >> .gitignore
echo # OS generated files >> .gitignore
echo .DS_Store >> .gitignore
echo .DS_Store? >> .gitignore
echo ._* >> .gitignore
echo .Spotlight-V100 >> .gitignore
echo .Trashes >> .gitignore
echo ehthumbs.db >> .gitignore
echo Thumbs.db >> .gitignore
echo. >> .gitignore
echo # PHP >> .gitignore
echo *.cache >> .gitignore
echo vendor/ >> .gitignore
echo composer.lock >> .gitignore
echo. >> .gitignore
echo # Database files >> .gitignore
echo *.sql.bak >> .gitignore
echo *.db >> .gitignore
echo *.sqlite >> .gitignore
echo *.sqlite3 >> .gitignore
echo. >> .gitignore
echo # Log files >> .gitignore
echo error.log >> .gitignore
echo access.log >> .gitignore
echo php_errors.log >> .gitignore
echo. >> .gitignore
echo # Temporary files >> .gitignore
echo tmp/ >> .gitignore
echo temp/ >> .gitignore
echo *.tmp >> .gitignore
echo. >> .gitignore
echo # Backup files >> .gitignore
echo *.bak >> .gitignore
echo *.backup >> .gitignore
echo. >> .gitignore
echo # Upload directories >> .gitignore
echo uploads/ >> .gitignore
echo files/ >> .gitignore

rem Add all files
echo Adding all files to Git...
git add .

rem Check status
echo.
echo Git status:
git status

rem Create commit
echo.
echo Creating commit...
git commit -m "Initial commit: Complete Registration Portal Application

?? Features:
- Admin panel with comprehensive dashboard and user management
- Public user registration with invitation system
- Profile completion workflow with validation
- Secure authentication and session management
- Responsive design optimized for mobile and desktop
- RESTful API architecture with PHP/MySQL backend
- Referral system for user invitations
- Subscription management with payment placeholder

?? Tech Stack:
- Frontend: HTML5, Tailwind CSS, Vanilla JavaScript
- Backend: PHP 7.4+, MySQL 8.0+, PDO
- Security: Password hashing, SQL injection prevention, XSS protection
- Design: Mobile-first responsive design

?? Structure:
- admin/ - Admin panel (can be separate subdomain)
- public/ - Public user interface
- config/ - Database and session configuration
- database/ - SQL schema and setup files
- Comprehensive documentation and setup guides"

rem Set main branch and push
echo.
echo Setting main branch and pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ? Push completed! Check your repository at:
echo https://github.com/d299techie/Onboard2
echo.
echo Note: You may need to enter your GitHub username and Personal Access Token when prompted.
echo.
pause
