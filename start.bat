@echo off
cd /d "%~dp0"

echo ====================================
echo   Opendrap DevOps AI Platform
echo ====================================
echo   Local UI  →  Production API
echo ====================================
echo.
echo Starting frontend dev server ...
echo.
echo API:  https://opendrap-api.tert.workers.dev/api
echo WS:   wss://opendrap-api.tert.workers.dev
echo.
echo NOTE: Terminal connects to your agent on Cloud Shell.
echo       Login on the site to authenticate.
echo.
npx vite --host 127.0.0.1
