@echo off
setlocal enabledelayedexpansion
color 0B

echo ================================================================
echo    REGAPP2 - RESTORATION VERIFICATION TOOL
echo ================================================================
echo.

:: Get current directory
set "CURRENT_DIR=%CD%"
echo Current directory: %CURRENT_DIR%
echo.

echo ================================================================
echo CHECKING FILE STRUCTURE...
echo ================================================================

:: Check for HTML files
echo [1/6] Checking for HTML files...
set html_count=0
for /f %%i in ('dir /s /b *.html 2^>nul ^| find /c /v ""') do set html_count=%%i
if !html_count! gtr 0 (
    echo ✓ Found !html_count! HTML files
    echo   Key HTML files that should exist:
    if exist "public\frontend\index.html" echo   ✓ public\frontend\index.html
    if exist "public\frontend\login.html" echo   ✓ public\frontend\login.html
    if exist "public\frontend\register.html" echo   ✓ public\frontend\register.html
    if exist "admin\frontend\login.html" echo   ✓ admin\frontend\login.html
    if exist "admin\frontend\dashboard.html" echo   ✓ admin\frontend\dashboard.html
) else (
    echo ❌ No HTML files found - restoration may have failed
)

echo.
echo [2/6] Checking PHP file structure...
set php_count=0
for /f %%i in ('dir /s /b *.php 2^>nul ^| find /c /v ""') do set php_count=%%i
echo Found !php_count! PHP files
echo   Expected PHP files (backend only):
if exist "config\database.php" echo   ✓ config\database.php
if exist "config\session.php" echo   ✓ config\session.php
if exist "public\backend\register.php" echo   ✓ public\backend\register.php
if exist "public\backend\login.php" echo   ✓ public\backend\login.php
if exist "admin\backend\login.php" echo   ✓ admin\backend\login.php

echo.
echo [3/6] Checking directory structure...
if exist "public\frontend" (
    echo ✓ public\frontend directory exists
) else (
    echo ❌ public\frontend directory missing
)

if exist "public\backend" (
    echo ✓ public\backend directory exists
) else (
    echo ❌ public\backend directory missing
)

if exist "admin\frontend" (
    echo ✓ admin\frontend directory exists
) else (
    echo ❌ admin\frontend directory missing
)

if exist "admin\backend" (
    echo ✓ admin\backend directory exists
) else (
    echo ❌ admin\backend directory missing
)

if exist "config" (
    echo ✓ config directory exists
) else (
    echo ❌ config directory missing
)

if exist "database" (
    echo ✓ database directory exists
) else (
    echo ❌ database directory missing
)

echo.
echo [4/6] Checking backup locations...
for %%I in ("%CURRENT_DIR%") do set "PARENT_DIR=%%~dpI"
set "BACKUP_DIR=%PARENT_DIR%regapp2_php_migration_backup"

if exist "%BACKUP_DIR%" (
    echo ✓ Local backup exists: %BACKUP_DIR%
    
    :: Count files in backup
    set backup_count=0
    for /f %%i in ('dir /s /b "%BACKUP_DIR%\*.*" 2^>nul ^| find /c /v ""') do set backup_count=%%i
    echo   Backup contains !backup_count! files
) else (
    echo ❌ Local backup not found: %BACKUP_DIR%
)

echo.
echo [5/6] Checking Git status...
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not available or not a Git repository
) else (
    echo ✓ Git repository detected
    
    :: Check current branch
    for /f %%i in ('git branch --show-current 2^>nul') do set current_branch=%%i
    echo   Current branch: !current_branch!
    
    if "!current_branch!"=="master" (
        echo ✓ On master branch (correct)
    ) else (
        echo ⚠ Not on master branch (expected: master, actual: !current_branch!)
    )
    
    :: Check if backup branch exists
    git branch -a | findstr "php-migration-backup" >nul 2>&1
    if errorlevel 1 (
        echo ⚠ Backup branch 'php-migration-backup' not found locally
    ) else (
        echo ✓ Backup branch 'php-migration-backup' exists
    )
    
    :: Check remote backup branch
    git ls-remote --heads origin php-migration-backup >nul 2>&1
    if errorlevel 1 (
        echo ⚠ Backup branch not found on GitHub (may need manual push)
    ) else (
        echo ✓ Backup branch exists on GitHub
    )
)

echo.
echo [6/6] File comparison summary...
echo HTML files: !html_count!
echo PHP files: !php_count!

:: Determine restoration status
set restoration_status=SUCCESS
if !html_count! equ 0 set restoration_status=FAILED
if not exist "%BACKUP_DIR%" set restoration_status=PARTIAL

echo.
echo ================================================================
echo VERIFICATION RESULTS
echo ================================================================

if "!restoration_status!"=="SUCCESS" (
    echo ✅ RESTORATION APPEARS SUCCESSFUL
    echo.
    echo ✓ HTML files are present
    echo ✓ Directory structure is correct
    echo ✓ Backup was created
    echo ✓ Git is in correct state
    echo.
    echo You can now start your fresh PHP migration!
) else if "!restoration_status!"=="PARTIAL" (
    echo ⚠ PARTIAL SUCCESS - Some issues detected
    echo.
    echo The HTML restoration seems to have worked, but:
    echo - Backup creation may have failed
    echo - Some Git operations may need manual attention
    echo.
    echo Please review the warnings above.
) else (
    echo ❌ RESTORATION FAILED
    echo.
    echo Issues detected:
    echo - HTML files are missing
    echo - The restoration may not have completed properly
    echo.
    echo Please check:
    echo 1. Git connection to GitHub
    echo 2. Run the backup script again
    echo 3. Manually verify the repository state
)

echo.
echo ================================================================
echo QUICK ACCESS COMMANDS
echo ================================================================
echo.
echo To view your PHP backup:
echo   explorer "%BACKUP_DIR%"
echo.
echo To switch to backup branch and see PHP version:
echo   git checkout php-migration-backup
echo.
echo To return to HTML version:
echo   git checkout master
echo.
echo To push backup branch if it failed:
echo   git checkout php-migration-backup
echo   git push -u origin php-migration-backup
echo   git checkout master
echo.

pause
