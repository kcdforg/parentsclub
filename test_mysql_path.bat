@echo off
title Test MySQL PATH Issue
color 0E

echo ################################################################
echo                     MYSQL PATH DIAGNOSTIC
echo ################################################################
echo.

echo [1] Testing global MySQL command...
mysql --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] MySQL is in system PATH
    mysql --version
) else (
    echo [❌] MySQL NOT in system PATH - this is the problem!
)
echo.

echo [2] Testing XAMPP MySQL directly...
set XAMPP_MYSQL=C:\xampp\mysql\bin
if exist "%XAMPP_MYSQL%\mysql.exe" (
    echo [✓] XAMPP MySQL found at: %XAMPP_MYSQL%
    "%XAMPP_MYSQL%\mysql.exe" --version
    echo.
    echo [SOLUTION] Adding XAMPP MySQL to PATH temporarily...
    set PATH=%XAMPP_MYSQL%;%PATH%
    echo [TEST] Testing MySQL command after PATH fix...
    mysql --version >nul 2>&1
    if %errorLevel% == 0 (
        echo [✅] PATH FIX SUCCESSFUL!
        echo     This is what the master fix script will do.
        echo     MySQL is working perfectly - ready for master fix!
    ) else (
        echo [❌] PATH fix failed - dependencies missing
    )
) else (
    echo [❌] XAMPP MySQL not found at: %XAMPP_MYSQL%
    echo     Please check your XAMPP installation
)
echo.

echo [3] Checking MySQL dependencies...
echo [INFO] MySQL requires Visual C++ Redistributables
echo       If commands fail, install: https://aka.ms/vs/17/release/vc_redist.x64.exe
echo.

pause
