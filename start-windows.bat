@echo off
setlocal
cd /d "%~dp0"
if not exist server\.env copy server\.env.example server\.env >nul
if not exist node_modules (
  echo Installing root dependencies...
  call npm install || goto :error
)
if not exist server\node_modules (
  echo Installing server dependencies...
  call npm install --prefix server || goto :error
)
if not exist client\node_modules (
  echo Installing client dependencies...
  call npm install --prefix client || goto :error
)
echo Starting Hcinco Discord Voice Dashboard...
call npm run dev
goto :eof
:error
echo.
echo Installation or startup failed. Make sure Node.js 22.12+ and internet access are available.
pause
exit /b 1
