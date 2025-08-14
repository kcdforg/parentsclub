@echo off
title MySQL Fix - Step 2: Stop and Cleanup
color 0C
setlocal enabledelayedexpansion

echo.
echo ################################################################
echo               STEP 2: STOP AND CLEANUP
echo              Safe Process Termination
echo ################################################################
echo.

REM Setup paths
set XAMPP_ROOT=C:\xampp
set MYSQL_ROOT=%XAMPP_ROOT%\mysql
set MYSQL_BIN=%MYSQL_ROOT%\bin
set MYSQL_DATA=%MYSQL_ROOT%\data

echo [1/8] Identifying port 3306 usage...
netstat -ano | findstr :3306 >nul
if %errorLevel% == 0 (
    echo [FOUND] Port 3306 is in use - identifying processes...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306 ^| findstr LISTENING') do (
        set PID=%%a
        for /f "tokens=1" %%b in ('tasklist /FI "PID eq %%a" /FO CSV /NH 2^>nul') do (
            set PROCESS_NAME=%%b
            set PROCESS_NAME=!PROCESS_NAME:"=!
            echo     Process: !PROCESS_NAME! (PID: %%a)
        )
    )
) else (
    echo [✓] Port 3306 is available
)

echo.
echo [2/8] Stopping MySQL processes gracefully...
tasklist /FI "IMAGENAME eq mysqld.exe" | findstr mysqld >nul
if %errorLevel% == 0 (
    echo     Sending termination signal to mysqld.exe...
    taskkill /IM mysqld.exe >nul 2>&1
    timeout /t 5 /nobreak >nul
    
    REM Check if still running
    tasklist /FI "IMAGENAME eq mysqld.exe" | findstr mysqld >nul
    if %errorLevel% == 0 (
        echo     Force terminating mysqld.exe...
        taskkill /F /IM mysqld.exe >nul 2>&1
    )
) else (
    echo [✓] No mysqld.exe processes found
)

echo.
echo [3/8] Stopping other MySQL processes...
taskkill /F /IM mysql.exe >nul 2>&1
echo [✓] Terminated any mysql.exe processes

echo.
echo [4/8] Handling Windows MySQL service...
sc query mysql >nul 2>&1
if %errorLevel% == 0 (
    echo     Found Windows MySQL service - stopping...
    net stop mysql >nul 2>&1
    
    echo     Disabling Windows MySQL service to prevent conflicts...
    sc config mysql start= disabled >nul 2>&1
    echo [✓] Windows MySQL service disabled
) else (
    echo [✓] No Windows MySQL service found
)

echo.
echo [5/8] Stopping XAMPP Control Panel (if running)...
taskkill /IM xampp-control.exe >nul 2>&1
echo [✓] XAMPP Control Panel stopped

echo.
echo [6/8] Waiting for processes to fully terminate...
timeout /t 10 /nobreak >nul

echo.
echo [7/8] Verifying all MySQL processes stopped...
tasklist /FI "IMAGENAME eq mysqld.exe" | findstr mysqld >nul
if %errorLevel% == 0 (
    echo [WARNING] mysqld.exe still running - attempting force kill...
    taskkill /F /IM mysqld.exe >nul 2>&1
) else (
    echo [✓] All mysqld.exe processes stopped
)

echo.
echo [8/8] Cleaning up corrupted InnoDB files...
cd /d "%MYSQL_DATA%"

echo     Removing InnoDB log files...
del /q ib_logfile0 >nul 2>&1
del /q ib_logfile1 >nul 2>&1
echo [✓] InnoDB log files removed

echo     Removing InnoDB data file...
del /q ibdata1 >nul 2>&1
echo [✓] InnoDB data file removed

echo     Removing error logs...
del /q *.err >nul 2>&1
del /q mysql_error.log >nul 2>&1
echo [✓] Error logs cleaned

echo     Removing auto.cnf...
del /q auto.cnf >nul 2>&1
echo [✓] Auto configuration cleaned

echo.
echo ################################################################
echo                  STOP AND CLEANUP COMPLETE
echo ################################################################
echo.
echo ✅ Process Status:
echo    - MySQL daemon: STOPPED
echo    - MySQL client: STOPPED  
echo    - Windows service: DISABLED
echo    - XAMPP Control: STOPPED
echo    - Port 3306: RELEASED
echo.
echo 🧹 Cleanup Status:
echo    - InnoDB log files: REMOVED
echo    - InnoDB data file: REMOVED
echo    - Error logs: CLEARED
echo    - Auto config: RESET
echo.
echo 🎯 System ready for fresh MySQL configuration
echo.
echo NEXT STEP: Run 3-CONFIGURE-MYSQL.bat
echo.
pause
