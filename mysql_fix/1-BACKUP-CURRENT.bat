@echo off
title MySQL Fix - Step 1: Backup Current Data
color 0B
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo                  STEP 1: BACKUP CURRENT DATA
echo                   Safe Data Preservation
echo ################################################################
echo.

REM Setup paths
set XAMPP_ROOT=C:\xampp
set MYSQL_ROOT=%XAMPP_ROOT%\mysql
set MYSQL_BIN=%MYSQL_ROOT%\bin
set MYSQL_DATA=%MYSQL_ROOT%\data
set PROJECT_ROOT=%~dp0..

REM Create timestamped backup directory
set BACKUP_DIR=%PROJECT_ROOT%\mysql_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set BACKUP_DIR=%BACKUP_DIR::=-%
set BACKUP_DIR=%BACKUP_DIR: =%

echo [1/6] Creating backup directory...
mkdir "%BACKUP_DIR%" >nul 2>&1
echo [✓] Backup directory: %BACKUP_DIR%

echo.
echo [2/6] Backing up MySQL configuration...
if exist "%MYSQL_BIN%\my.ini" (
    copy "%MYSQL_BIN%\my.ini" "%BACKUP_DIR%\my.ini.backup" >nul 2>&1
    echo [✓] MySQL configuration backed up
) else (
    echo [!] No existing configuration found
)

echo.
echo [3/6] Checking MySQL service status...
tasklist /FI "IMAGENAME eq mysqld.exe" | findstr mysqld >nul
if %errorLevel% == 0 (
    echo [✓] MySQL is running - attempting database backup
    set MYSQL_RUNNING=1
) else (
    echo [!] MySQL is not running - will backup data files only
    set MYSQL_RUNNING=0
)

echo.
echo [4/6] Attempting database backup...
if %MYSQL_RUNNING% == 1 (
    REM Try to backup database using mysqldump
    echo     Trying to backup regapp_db database...
    "%MYSQL_BIN%\mysqldump.exe" -u root regapp_db > "%BACKUP_DIR%\regapp_db_backup.sql" 2>nul
    if %errorLevel% == 0 (
        echo [✓] Database backup successful
        set DB_BACKUP_SUCCESS=1
    ) else (
        echo [!] Database backup failed - MySQL may not be responsive
        set DB_BACKUP_SUCCESS=0
    )
    
    REM Try to backup all databases
    echo     Trying to backup all databases...
    "%MYSQL_BIN%\mysqldump.exe" -u root --all-databases > "%BACKUP_DIR%\all_databases_backup.sql" 2>nul
    if %errorLevel% == 0 (
        echo [✓] All databases backup successful
    ) else (
        echo [!] All databases backup failed
    )
) else (
    echo [!] Skipping database backup - MySQL not running
    set DB_BACKUP_SUCCESS=0
)

echo.
echo [5/6] Backing up data directory structure...
if exist "%MYSQL_DATA%\regapp_db" (
    echo     Copying regapp_db data files...
    xcopy "%MYSQL_DATA%\regapp_db" "%BACKUP_DIR%\data_files\regapp_db\" /E /I /Q >nul 2>&1
    if %errorLevel% == 0 (
        echo [✓] Data files backed up
    ) else (
        echo [!] Data files backup failed
    )
) else (
    echo [!] No regapp_db data directory found
)

echo.
echo [6/6] Creating backup inventory...
(
echo ================================
echo MySQL Backup Inventory
echo ================================
echo Backup Date: %date% %time%
echo Backup Location: %BACKUP_DIR%
echo.
echo Files Included:
if exist "%BACKUP_DIR%\my.ini.backup" (
    echo [✓] my.ini.backup - MySQL configuration
) else (
    echo [✗] my.ini.backup - Not found
)
if exist "%BACKUP_DIR%\regapp_db_backup.sql" (
    echo [✓] regapp_db_backup.sql - Database dump
) else (
    echo [✗] regapp_db_backup.sql - Not created
)
if exist "%BACKUP_DIR%\all_databases_backup.sql" (
    echo [✓] all_databases_backup.sql - Complete MySQL dump
) else (
    echo [✗] all_databases_backup.sql - Not created
)
if exist "%BACKUP_DIR%\data_files\" (
    echo [✓] data_files\ - Raw data directory backup
) else (
    echo [✗] data_files\ - Not created
)
echo.
echo Restore Instructions:
echo 1. To restore configuration: copy my.ini.backup to %MYSQL_BIN%\my.ini
echo 2. To restore database: mysql -u root regapp_db ^< regapp_db_backup.sql
echo 3. To restore all databases: mysql -u root ^< all_databases_backup.sql
echo.
) > "%BACKUP_DIR%\BACKUP_INVENTORY.txt"

echo [✓] Backup inventory created

echo.
echo ################################################################
echo                    BACKUP COMPLETE
echo ################################################################
echo.
echo 📁 Backup Location: %BACKUP_DIR%
echo.
if %DB_BACKUP_SUCCESS% == 1 (
    echo ✅ SAFE TO PROCEED - Database backup successful
    echo    Your data is protected and can be restored if needed
) else (
    echo ⚠️  CAUTION - Database backup failed
    echo    Data files were copied but SQL dump may be incomplete
    echo    Proceed with extra caution
)
echo.
echo 📋 Backup Contents:
if exist "%BACKUP_DIR%\my.ini.backup" echo    ✓ MySQL configuration
if exist "%BACKUP_DIR%\regapp_db_backup.sql" echo    ✓ Database SQL dump
if exist "%BACKUP_DIR%\all_databases_backup.sql" echo    ✓ All databases dump
if exist "%BACKUP_DIR%\data_files\" echo    ✓ Raw data files
echo.
echo NEXT STEP: Run 2-STOP-CLEANUP.bat
echo.
pause
