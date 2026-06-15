@echo off
title Opendrap - Publishing

echo ========================================
echo    Opendrap DevOps AI Platform
echo    Publishing to Cloudflare...
echo ========================================
echo.

REM === Step 1: Build Frontend ===
echo [1/4] Building frontend (Vite)...
cd /d "%~dp0"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Frontend build failed.
    pause
    exit /b 1
)
echo [OK] Frontend built successfully.
echo.

REM === Step 2: DB Migrations ===
echo [2/4] Running database migrations...
cd /d "%~dp0workers"
call npm run migrate
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Migrations failed.
    pause
    exit /b 1
)
echo [OK] Migrations applied.
echo.

REM === Step 3: Deploy Worker ===
echo [3/4] Deploying Cloudflare Worker...
cd /d "%~dp0workers"
call npm run deploy
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Worker deploy failed.
    pause
    exit /b 1
)
echo [OK] Worker deployed to Cloudflare.
echo.

REM === Step 4: Deploy Pages ===
echo [4/4] Deploying frontend to Cloudflare Pages...
cd /d "%~dp0"
npx wrangler pages deploy dist/ --project-name opendevops
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Pages deploy failed.
    pause
    exit /b 1
)
echo [OK] Frontend deployed to Cloudflare Pages.
echo.

echo ========================================
echo    All done! ^(ɔ^)窿
echo    Worker:  https://opendrap-api.tert.workers.dev
echo    Pages:   https://opendevops.pages.dev
echo ========================================
echo.
pause
