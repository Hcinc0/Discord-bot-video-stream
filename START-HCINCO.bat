@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Hcinco Discord Voice Dashboard - Launcher

echo ========================================================
echo   HCINCO DISCORD VOICE DASHBOARD v2.2 - MEDIA FIX LAUNCHER
echo ========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Install Node.js 22.12.0 or newer, then reopen PowerShell.
  pause
  exit /b 1
)

node scripts\check-node.mjs
if errorlevel 1 (
  pause
  exit /b 1
)

if not exist server\.env (
  copy /Y server\.env.example server\.env >nul
  echo [OK] Created server\.env
)

if not exist server\node_modules\discord.js\package.json (
  echo [SETUP] Installing backend dependencies...
  call npm install --prefix server
  if errorlevel 1 goto :install_error
)

if not exist client\node_modules\vite\package.json (
  echo [SETUP] Installing frontend dependencies...
  call npm install --prefix client
  if errorlevel 1 goto :install_error
)

echo.
echo [START] Opening backend window...
start "Hcinco Backend - KEEP OPEN" cmd /k "cd /d ""%~dp0server"" && npm run dev"

echo [WAIT] Waiting for backend health endpoint...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4000/api/health -TimeoutSec 1;if($r.StatusCode -eq 200){$ok=$true;break}}catch{};Start-Sleep -Milliseconds 500}; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo.
  echo [ERROR] Backend did not become ready on port 4000.
  echo Look at the "Hcinco Backend - KEEP OPEN" window for the exact error.
  pause
  exit /b 1
)

echo [OK] Backend is online.
echo [START] Opening frontend window...
start "Hcinco Frontend - KEEP OPEN" cmd /k "cd /d ""%~dp0client"" && npm run dev"

timeout /t 2 /nobreak >nul
start "" http://localhost:5173/

echo.
echo Dashboard started successfully.
echo Keep BOTH Backend and Frontend windows open while using the dashboard.
echo You can close this launcher window now.
echo.
pause
exit /b 0

:install_error
echo.
echo [ERROR] npm install failed. Check your internet connection and npm output above.
pause
exit /b 1
