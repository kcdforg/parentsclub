@echo off
title MySQL Fix - Step 0: Prerequisite Check
color 0E
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo               STEP 0: PREREQUISITE CHECK
echo               Verify System Requirements
echo ################################################################
echo.

REM Check Administrator privileges
echo [CHECK 1/5] Verifying Administrator privileges...
net session >nul 2>&1
if not %errorLevel% == 0 (
    echo [ERROR] This script requires Administrator privileges!
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)
echo [✓] Running as Administrator

REM Define paths
set XAMPP_ROOT=C:\xampp
set MYSQL_ROOT=%XAMPP_ROOT%\mysql
set MYSQL_BIN=%MYSQL_ROOT%\bin
set MYSQL_DATA=%MYSQL_ROOT%\data
set PROJECT_ROOT=%~dp0..

echo.
echo [CHECK 2/5] Verifying XAMPP installation...
if not exist "%XAMPP_ROOT%" (
    echo [ERROR] XAMPP not found at %XAMPP_ROOT%
    echo Please install XAMPP or adjust the path
    pause
    exit /b 1
)
echo [✓] XAMPP found at %XAMPP_ROOT%

echo.
echo [CHECK 3/5] Verifying MySQL executables...
if not exist "%MYSQL_BIN%\mysql.exe" (
    echo [ERROR] mysql.exe not found in %MYSQL_BIN%
    pause
    exit /b 1
)
if not exist "%MYSQL_BIN%\mysqld.exe" (
    echo [ERROR] mysqld.exe not found in %MYSQL_BIN%
    pause
    exit /b 1
)
echo [✓] MySQL executables found

echo.
echo [CHECK 4/5] Testing MySQL command accessibility...
"%MYSQL_BIN%\mysql.exe" --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] MySQL commands are accessible
    "%MYSQL_BIN%\mysql.exe" --version
) else (
    echo [ERROR] MySQL commands not working
    echo This might be due to missing Visual C++ Redistributables
    echo Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
    pause
    exit /b 1
)

echo.
echo [CHECK 5/5] Verifying project files...
if not exist "%PROJECT_ROOT%\database\production_schema.sql" (
    echo [ERROR] Database schema file not found
    echo Expected: %PROJECT_ROOT%\database\production_schema.sql
    pause
    exit /b 1
)
echo [✓] Project files found

echo.
echo ################################################################
echo                   PREREQUISITE CHECK COMPLETE
echo ################################################################
echo.
echo ✅ System Requirements Met:
echo    - Administrator privileges: OK
echo    - XAMPP installation: OK  
echo    - MySQL executables: OK
echo    - MySQL commands: OK
echo    - Project files: OK
echo.
echo 🎯 Ready to proceed with MySQL fix!
echo.
echo NEXT STEPS:
echo    1. Run: 1-BACKUP-CURRENT.bat
echo    2. Run: 2-STOP-CLEANUP.bat  
echo    3. Run: 3-CONFIGURE-MYSQL.bat
echo    4. Run: 4-START-IMPORT.bat
echo    5. Run: 5-VERIFY-TEST.bat
echo.
pause
