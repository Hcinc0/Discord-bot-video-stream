@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Hcinco - Clean Install

echo This removes old dependency folders and installs the exact project dependencies again.
echo Your saved bot token under server\data is NOT deleted.
echo.
node scripts\check-node.mjs
if errorlevel 1 (
  pause
  exit /b 1
)

if exist server\node_modules rmdir /s /q server\node_modules
if exist client\node_modules rmdir /s /q client\node_modules
if exist server\package-lock.json del /q server\package-lock.json
if exist client\package-lock.json del /q client\package-lock.json

echo Installing backend...
call npm install --prefix server
if errorlevel 1 goto :error

echo Installing frontend...
call npm install --prefix client
if errorlevel 1 goto :error

echo.
echo Clean install completed. Run START-HCINCO.bat
pause
exit /b 0

:error
echo.
echo Installation failed. Read the npm error above.
pause
exit /b 1
