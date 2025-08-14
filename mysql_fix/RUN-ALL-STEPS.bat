@echo off
title MySQL Fix - Complete Process (All Steps)
color 0E
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo                    MYSQL COMPLETE FIX
echo                  Automated Full Process
echo ################################################################
echo.
echo This script will run all MySQL fix steps in sequence:
echo.
echo 0. Prerequisite Check
echo 1. Backup Current Data
echo 2. Stop and Cleanup  
echo 3. Configure MySQL
echo 4. Start and Import
echo 5. Verify and Test
echo.
echo ⚠️  IMPORTANT SAFETY NOTICE:
echo    - This will RESTART MySQL with new configuration
echo    - Your data will be BACKED UP before any changes
echo    - Process can be stopped at any step if issues occur
echo    - Each step has safety checks and validation
echo.

set /p CONFIRM="Do you want to proceed with the complete fix? (Y/N): "
if /i not "%CONFIRM%" == "Y" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo ################################################################
echo                    STARTING AUTOMATED FIX
echo ################################################################
echo.

REM Step 0: Prerequisites
echo Running Step 0: Prerequisite Check...
call "%~dp0\0-PREREQUISITE-CHECK.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Prerequisite check failed. Aborting.
    pause
    exit /b 1
)

REM Step 1: Backup
echo.
echo Running Step 1: Backup Current Data...
call "%~dp0\1-BACKUP-CURRENT.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Backup failed. Aborting for safety.
    pause
    exit /b 1
)

REM Step 2: Stop and Cleanup
echo.
echo Running Step 2: Stop and Cleanup...
call "%~dp0\2-STOP-CLEANUP.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Stop/cleanup failed. Manual intervention needed.
    pause
    exit /b 1
)

REM Step 3: Configure
echo.
echo Running Step 3: Configure MySQL...
call "%~dp0\3-CONFIGURE-MYSQL.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Configuration failed. Check my.ini settings.
    pause
    exit /b 1
)

REM Step 4: Start and Import
echo.
echo Running Step 4: Start and Import...
call "%~dp0\4-START-IMPORT.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Start/import failed. Check MySQL logs.
    pause
    exit /b 1
)

REM Step 5: Verify
echo.
echo Running Step 5: Verify and Test...
call "%~dp0\5-VERIFY-TEST.bat"
if %errorLevel% neq 0 (
    echo [ERROR] Verification failed. Manual check needed.
    pause
    exit /b 1
)

echo.
echo ################################################################
echo                 COMPLETE FIX SUCCESSFUL!
echo ################################################################
echo.
echo 🎉 ALL STEPS COMPLETED SUCCESSFULLY!
echo.
echo ✅ Your MySQL is now:
echo    - Running stable on port 3306
echo    - Optimized for performance (~160MB memory)
echo    - Configured with UTF8MB4 character set
echo    - Ready for production use
echo.
echo 🔑 Access Your Application:
echo    - Admin Panel: http://localhost/regapp2/admin/frontend/login.html
echo    - Credentials: admin / admin123
echo.
echo 📊 System Status:
echo    - Database: regapp_db (fully functional)
echo    - Tables: All created and indexed
echo    - Backup: Available in backup folder
echo    - Report: MYSQL_FIX_REPORT.txt generated
echo.
echo 🎯 MySQL is now ROCK SOLID!
echo.
pause
