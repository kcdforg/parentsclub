@echo off
setlocal enabledelayedexpansion
color 0A

echo ================================================================
echo    REGAPP2 - PHP TO HTML MIGRATION BACKUP & RESTORE TOOL
echo ================================================================
echo.
echo This script will:
echo 1. Backup your current PHP-migrated version
echo 2. Create a Git branch to preserve PHP changes on GitHub
echo 3. Reset to the original HTML version from GitHub
echo 4. Verify the restoration was successful
echo.
echo WARNING: This will replace your current working directory with
echo          the HTML version from GitHub. Your PHP changes will be
echo          safely backed up but removed from the working directory.
echo.

:: Get current directory and validate we're in the right place
set "CURRENT_DIR=%CD%"
echo Current directory: %CURRENT_DIR%

:: Check if we're in the regapp2 directory
echo %CURRENT_DIR% | findstr /C:"regapp2" >nul
if errorlevel 1 (
    echo ERROR: Please run this script from within the regapp2 directory
    echo Expected path to contain 'regapp2'
    pause
    exit /b 1
)

:: Check if .git directory exists
if not exist ".git" (
    echo ERROR: No .git directory found. This doesn't appear to be a Git repository.
    pause
    exit /b 1
)

:: Confirm before proceeding
echo.
set /p confirm="Do you want to proceed? (Y/N): "
if /i not "!confirm!"=="Y" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo ================================================================
echo STEP 1: Creating backup of current PHP version...
echo ================================================================

:: Get parent directory
for %%I in ("%CURRENT_DIR%") do set "PARENT_DIR=%%~dpI"
set "BACKUP_DIR=%PARENT_DIR%regapp2_php_migration_backup"

echo Backup location: %BACKUP_DIR%

:: Remove existing backup if it exists
if exist "%BACKUP_DIR%" (
    echo Removing existing backup directory...
    rd /s /q "%BACKUP_DIR%" 2>nul
    if exist "%BACKUP_DIR%" (
        echo ERROR: Could not remove existing backup directory
        echo Please manually delete: %BACKUP_DIR%
        pause
        exit /b 1
    )
)

:: Create backup
echo Creating complete backup of current PHP version...
xcopy "%CURRENT_DIR%" "%BACKUP_DIR%" /E /I /H /Y /Q >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to create backup
    pause
    exit /b 1
)

:: Verify backup was created
if not exist "%BACKUP_DIR%" (
    echo ERROR: Backup directory was not created
    pause
    exit /b 1
)

echo ✓ Backup created successfully at: %BACKUP_DIR%

echo.
echo ================================================================
echo STEP 2: Checking Git status and creating backup branch...
echo ================================================================

:: Check if there are uncommitted changes
git status --porcelain > temp_status.txt 2>nul
if errorlevel 1 (
    echo ERROR: Git command failed. Please check your Git installation.
    del temp_status.txt 2>nul
    pause
    exit /b 1
)

:: Check if temp_status.txt has content (uncommitted changes)
for %%I in (temp_status.txt) do set size=%%~zI
if !size! gtr 0 (
    echo Found uncommitted changes. Adding them to Git...
    
    :: Add all changes
    git add . 2>nul
    if errorlevel 1 (
        echo ERROR: Failed to add files to Git
        del temp_status.txt 2>nul
        pause
        exit /b 1
    )
    
    :: Create timestamp for commit message
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%a-%%b-%%c
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
    
    :: Commit changes
    git commit -m "Backup: PHP migration before reverting to HTML version (!mydate! !mytime!)" 2>nul
    if errorlevel 1 (
        echo WARNING: Commit failed, but continuing...
    ) else (
        echo ✓ Changes committed successfully
    )
) else (
    echo ✓ No uncommitted changes found
)

del temp_status.txt 2>nul

:: Create and switch to backup branch
echo Creating backup branch 'php-migration-backup'...
git checkout -b php-migration-backup 2>nul
if errorlevel 1 (
    echo Branch might already exist, switching to it...
    git checkout php-migration-backup 2>nul
    if errorlevel 1 (
        echo ERROR: Failed to create or switch to backup branch
        pause
        exit /b 1
    )
)

echo ✓ Switched to backup branch

:: Push backup branch to GitHub
echo Pushing backup branch to GitHub...
git push -u origin php-migration-backup 2>nul
if errorlevel 1 (
    echo WARNING: Failed to push to GitHub. You may need to push manually later.
    echo Command: git push -u origin php-migration-backup
) else (
    echo ✓ Backup branch pushed to GitHub successfully
)

echo.
echo ================================================================
echo STEP 3: Restoring original HTML version from GitHub...
echo ================================================================

:: Switch back to master branch
echo Switching to master branch...
git checkout master 2>nul
if errorlevel 1 (
    echo ERROR: Failed to switch to master branch
    pause
    exit /b 1
)

echo ✓ Switched to master branch

:: Fetch latest from origin
echo Fetching latest changes from GitHub...
git fetch origin 2>nul
if errorlevel 1 (
    echo ERROR: Failed to fetch from GitHub
    pause
    exit /b 1
)

echo ✓ Fetched latest changes

:: Reset to origin/master (this removes all local changes)
echo Resetting to original HTML version...
echo WARNING: This will remove all local PHP migration changes from working directory
echo (They are safely backed up in the backup folder and GitHub branch)
echo.

set /p final_confirm="Continue with reset? (Y/N): "
if /i not "!final_confirm!"=="Y" (
    echo Operation cancelled. Your files remain unchanged.
    pause
    exit /b 0
)

git reset --hard origin/master 2>nul
if errorlevel 1 (
    echo ERROR: Failed to reset to origin/master
    pause
    exit /b 1
)

echo ✓ Reset to HTML version completed

echo.
echo ================================================================
echo STEP 4: Verification...
echo ================================================================

:: Check for HTML files
echo Checking for HTML files...
dir /s /b *.html >nul 2>&1
if errorlevel 1 (
    echo WARNING: No HTML files found. Please verify the restoration manually.
) else (
    echo ✓ HTML files found - restoration appears successful
)

:: Check if PHP files are significantly reduced
echo Checking PHP file count...
for /f %%i in ('dir /s /b *.php 2^>nul ^| find /c /v ""') do set php_count=%%i
echo Found !php_count! PHP files (should be much fewer than before)

:: Display backup information
echo.
echo ================================================================
echo SUCCESS! Migration backup and HTML restoration completed
echo ================================================================
echo.
echo BACKUP LOCATIONS:
echo 1. Local backup: %BACKUP_DIR%
echo 2. GitHub branch: php-migration-backup
echo.
echo CURRENT STATE:
echo - Working directory: Original HTML version from GitHub
echo - Your PHP migration: Safely preserved in backup locations
echo.
echo NEXT STEPS:
echo 1. Verify the HTML files are working correctly
echo 2. Start your fresh PHP migration when ready
echo 3. Compare with backup if needed: %BACKUP_DIR%
echo.
echo To access your PHP backup later:
echo - Local: Open %BACKUP_DIR%
echo - GitHub: git checkout php-migration-backup
echo.

pause
echo.
echo Script completed successfully!
pause
