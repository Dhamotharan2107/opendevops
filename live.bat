@echo off
title Opendrap - Local Dev

echo ========================================
echo    Opendrap DevOps AI Platform
echo    Starting local dev servers...
echo ========================================
echo.
echo Starting Worker API (http://127.0.0.1:8787) ...
echo Starting Frontend (http://localhost:5173) ...
echo.

cd /d "%~dp0workers"
start "Opendrap Worker" cmd /c "wrangler dev"

cd /d "%~dp0"
start "Opendrap Frontend" cmd /c "npm run dev"

echo.
echo Both servers starting in separate windows.
echo Press any key to stop (closes all windows).
echo.
pause

taskkill /fi "WindowTitle eq Opendrap Worker" /f >nul 2>&1
taskkill /fi "WindowTitle eq Opendrap Frontend" /f >nul 2>&1
echo Servers stopped.
