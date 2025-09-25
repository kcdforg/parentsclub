@echo off
echo Setting up Git repository and pushing to GitHub...

REM Initialize git if not already initialized
git init

REM Configure Git with your email and name
git config user.email "hexadann@gmail.com"
git config user.name "hexadann"

REM Add the remote repository
git remote remove origin 2>nul
git remote add origin https://github.com/kcdforg/parentsclub.git

REM Create .gitignore file
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo *.log >> .gitignore
echo .DS_Store >> .gitignore
echo debug_contact.log >> .gitignore

REM Add all files to staging
git add .

REM Create initial commit
git commit -m "Initial commit: Parents Club App with profile completion, admin panel, and invitation system

- Complete user registration and profile management system
- Admin dashboard with user management and invitation system  
- Responsive design with Tailwind CSS
- Secure authentication and session management
- Database schema with proper relationships
- API-based architecture with validation
- Fixed secondary phone saving issue and address auto-population
- Granular save functionality for profile sections"

REM Push to GitHub (master branch)
git branch -M main
git push -u origin main

echo.
echo Git setup complete! Repository pushed to GitHub.
pause
