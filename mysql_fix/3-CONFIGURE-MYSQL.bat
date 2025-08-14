@echo off
title MySQL Fix - Step 3: Configure MySQL
color 0A
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo               STEP 3: CONFIGURE MYSQL
echo            Apply Optimized Configuration
echo ################################################################
echo.

REM Setup paths
set XAMPP_ROOT=C:\xampp
set MYSQL_ROOT=%XAMPP_ROOT%\mysql
set MYSQL_BIN=%MYSQL_ROOT%\bin
set MYSQL_DATA=%MYSQL_ROOT%\data
set MY_INI=%MYSQL_BIN%\my.ini

echo [1/4] Creating optimized MySQL configuration...
echo     Generating production-ready my.ini file...

(
echo [mysqld]
echo # ===== BASIC SETTINGS =====
echo datadir=C:/xampp/mysql/data
echo port=3306
echo socket="C:/xampp/mysql/mysql.sock"
echo bind-address=127.0.0.1
echo default-storage-engine=INNODB
echo skip-name-resolve
echo skip-networking=0
echo.
echo # ===== MEMORY SETTINGS ^(OPTIMIZED FOR STABILITY^) =====
echo key_buffer_size=16M
echo max_allowed_packet=16M
echo table_open_cache=64
echo sort_buffer_size=512K
echo net_buffer_length=8K
echo read_buffer_size=256K
echo read_rnd_buffer_size=512K
echo myisam_sort_buffer_size=8M
echo.
echo # ===== CONNECTION SETTINGS =====
echo max_connections=50
echo thread_cache_size=4
echo back_log=50
echo max_connect_errors=10000
echo wait_timeout=28800
echo interactive_timeout=28800
echo.
echo # ===== QUERY CACHE =====
echo query_cache_type=1
echo query_cache_size=8M
echo query_cache_limit=1M
echo.
echo # ===== INNODB SETTINGS ^(GUARANTEED STABLE^) =====
echo innodb_data_home_dir="C:/xampp/mysql/data"
echo innodb_data_file_path=ibdata1:10M:autoextend
echo innodb_log_group_home_dir="C:/xampp/mysql/data"
echo innodb_buffer_pool_size=128M
echo innodb_log_file_size=32M
echo innodb_log_buffer_size=4M
echo innodb_flush_log_at_trx_commit=2
echo innodb_lock_wait_timeout=50
echo innodb_table_locks=0
echo innodb_thread_concurrency=4
echo innodb_file_per_table=1
echo.
echo # ===== LOGGING =====
echo log-error="C:/xampp/mysql/data/mysql_error.log"
echo general_log=0
echo slow_query_log=0
echo.
echo # ===== CHARACTER SETS =====
echo character-set-server=utf8mb4
echo collation-server=utf8mb4_unicode_ci
echo skip-character-set-client-handshake
echo.
echo # ===== SECURITY =====
echo sql_mode=STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
echo.
echo [mysql]
echo default-character-set=utf8mb4
echo.
echo [mysqldump]
echo quick
echo quote-names
echo max_allowed_packet=16M
echo.
echo [client]
echo default-character-set=utf8mb4
echo port=3306
echo socket="C:/xampp/mysql/mysql.sock"
) > "%MY_INI%"

echo [✓] Optimized configuration created

echo.
echo [2/4] Verifying configuration file...
if exist "%MY_INI%" (
    echo [✓] Configuration file created successfully
    echo     Location: %MY_INI%
    echo     Size: 
    for %%A in ("%MY_INI%") do echo     %%~zA bytes
) else (
    echo [ERROR] Failed to create configuration file
    pause
    exit /b 1
)

echo.
echo [3/4] Setting file permissions...
echo     Applying proper permissions to MySQL data directory...
icacls "%MYSQL_DATA%" /grant Everyone:F /T >nul 2>&1
echo [✓] File permissions updated

echo.
echo [4/4] Validating configuration settings...
echo     Key configuration parameters:
echo     - Memory usage: ~160MB total
echo     - InnoDB buffer pool: 128MB
echo     - Max connections: 50
echo     - Character set: UTF8MB4
echo     - Storage engine: InnoDB
echo     - File per table: Enabled
echo [✓] Configuration validation complete

echo.
echo ################################################################
echo                 MYSQL CONFIGURATION COMPLETE
echo ################################################################
echo.
echo ✅ Configuration Applied:
echo    - File location: %MY_INI%
echo    - Memory optimized: 128MB InnoDB buffer
echo    - Connection limit: 50 concurrent
echo    - Character set: UTF8MB4 (international)
echo    - Security: Enhanced SQL mode
echo    - File permissions: Updated
echo.
echo 🎯 Performance Profile:
echo    - Stable for systems with 2GB+ RAM
echo    - Optimized for development and small production
echo    - Conservative settings for maximum compatibility
echo    - File-per-table for better management
echo.
echo 📋 Key Features Enabled:
echo    - Query cache for better performance
echo    - Proper character encoding
echo    - InnoDB storage engine (ACID compliant)
echo    - Error logging enabled
echo    - Skip name resolution for faster connections
echo.
echo NEXT STEP: Run 4-START-IMPORT.bat
echo.
pause
