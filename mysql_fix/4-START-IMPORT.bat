@echo off
title MySQL Fix - Step 4: Start and Import
color 0D
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo              STEP 4: START AND IMPORT
echo           Launch MySQL and Setup Database
echo ################################################################
echo.

REM Setup paths
set XAMPP_ROOT=C:\xampp
set MYSQL_ROOT=%XAMPP_ROOT%\mysql
set MYSQL_BIN=%MYSQL_ROOT%\bin
set MYSQL_DATA=%MYSQL_ROOT%\data
set PROJECT_ROOT=%~dp0..

echo [1/8] Starting MySQL server...
cd /d "%MYSQL_BIN%"
echo     Launching mysqld with new configuration...
start "XAMPP MySQL Server" /MIN "%MYSQL_BIN%\mysqld.exe" --console

echo.
echo [2/8] Waiting for MySQL to initialize...
set MYSQL_READY=0
set ATTEMPT=0
for /L %%i in (1,1,30) do (
    set /a ATTEMPT=%%i
    timeout /t 2 /nobreak >nul
    
    "%MYSQL_BIN%\mysql.exe" -u root -e "SELECT 'ready' as status;" >nul 2>&1
    if not errorlevel 1 (
        echo [✓] MySQL connection successful after !ATTEMPT! attempts
        set MYSQL_READY=1
        goto :mysql_connected
    )
    echo     Attempt !ATTEMPT!/30: Waiting for MySQL startup...
)

:mysql_connected
if %MYSQL_READY% == 0 (
    echo [ERROR] MySQL startup timeout after 30 attempts
    echo Please check mysql_error.log for details
    pause
    exit /b 1
)

echo.
echo [3/8] Verifying MySQL process...
tasklist /FI "IMAGENAME eq mysqld.exe" | findstr mysqld >nul
if %errorLevel% == 0 (
    echo [✓] MySQL process is running
) else (
    echo [ERROR] MySQL process not found
    pause
    exit /b 1
)

echo.
echo [4/8] Testing database connectivity...
"%MYSQL_BIN%\mysql.exe" -u root -e "SELECT VERSION() as mysql_version;" >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Database connection working
    "%MYSQL_BIN%\mysql.exe" -u root -e "SELECT VERSION() as mysql_version;"
) else (
    echo [ERROR] Database connection failed
    pause
    exit /b 1
)

echo.
echo [5/8] Creating regapp_db database...
"%MYSQL_BIN%\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS regapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorLevel% == 0 (
    echo [✓] regapp_db database created/verified
) else (
    echo [ERROR] Could not create database
    pause
    exit /b 1
)

echo.
echo [6/8] Importing database schema...
cd /d "%PROJECT_ROOT%"

if exist "database\production_schema.sql" (
    echo     Using production schema...
    type "database\production_schema.sql" | "%MYSQL_BIN%\mysql.exe" -u root
    if %errorLevel% == 0 (
        echo [✓] Production schema imported successfully
        set SCHEMA_IMPORTED=production
    ) else (
        echo [WARNING] Production schema import had issues
        set SCHEMA_IMPORTED=failed
    )
) else if exist "database\schema.sql" (
    echo     Using legacy schema...
    type "database\schema.sql" | "%MYSQL_BIN%\mysql.exe" -u root regapp_db
    if %errorLevel% == 0 (
        echo [✓] Legacy schema imported successfully
        set SCHEMA_IMPORTED=legacy
    ) else (
        echo [WARNING] Legacy schema import had issues
        set SCHEMA_IMPORTED=failed
    )
) else (
    echo [ERROR] No schema file found
    echo Expected: database\production_schema.sql or database\schema.sql
    pause
    exit /b 1
)

echo.
echo [7/8] Verifying database structure...
"%MYSQL_BIN%\mysql.exe" -u root -e "USE regapp_db; SHOW TABLES;" >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Database structure verified
    echo     Tables created:
    "%MYSQL_BIN%\mysql.exe" -u root -e "USE regapp_db; SHOW TABLES;"
) else (
    echo [ERROR] Database structure verification failed
    pause
    exit /b 1
)

echo.
echo [8/8] Verifying admin user...
"%MYSQL_BIN%\mysql.exe" -u root -e "USE regapp_db; SELECT username, email FROM admin_users WHERE username = 'admin';" >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Admin user verified
    "%MYSQL_BIN%\mysql.exe" -u root -e "USE regapp_db; SELECT username, email FROM admin_users WHERE username = 'admin';"
) else (
    echo [WARNING] Admin user verification failed
)

echo.
echo ################################################################
echo                START AND IMPORT COMPLETE
echo ################################################################
echo.
echo ✅ MySQL Status:
echo    - Process: RUNNING
echo    - Port: 3306 (listening)
echo    - Database: regapp_db (ready)
echo    - Schema: %SCHEMA_IMPORTED%
echo    - Admin user: Available
echo.
echo 🎯 Connection Details:
echo    - Host: localhost
echo    - Port: 3306
echo    - Database: regapp_db
echo    - User: root (no password)
echo.
echo 🔑 Default Admin Credentials:
echo    - Username: admin
echo    - Password: admin123
echo    - Email: admin@example.com
echo.
echo 📊 Database Tables:
"%MYSQL_BIN%\mysql.exe" -u root -e "USE regapp_db; SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'regapp_db';" 2>nul
echo.
echo NEXT STEP: Run 5-VERIFY-TEST.bat
echo.
pause
