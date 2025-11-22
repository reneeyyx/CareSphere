@echo off
echo ========================================
echo CareSphere - Stopping All Services
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo   [OK] Node.js processes stopped
) else (
    echo   [INFO] No Node.js processes found
)

echo.
echo Stopping all Python processes...
taskkill /F /IM python.exe 2>nul
if %errorlevel% == 0 (
    echo   [OK] Python processes stopped
) else (
    echo   [INFO] No Python processes found
)

echo.
echo ========================================
echo All services stopped!
echo ========================================
echo.
pause
