@echo off
cd /d "%~dp0"

echo ====================================
echo   Opendrap DevOps AI Platform
echo ====================================
echo.

echo [1/2] Starting backend API server on :8787 ...
start "Opendrap-Backend" cmd /c "python server.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend dev server ...
npx vite --host 127.0.0.1

echo.
echo Servers stopped.
pause
