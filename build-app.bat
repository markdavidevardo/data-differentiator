@echo off
setlocal
title Data Differentiator - Build
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Download the LTS version from https://nodejs.org, install it, then run this file again.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 22 (
  echo Node.js 22 or newer is required. You have version %NODE_MAJOR%.
  echo Download the LTS version from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

rem Skip code signing so the build works without a certificate.
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo [1/4] Installing packages...
if exist package-lock.json (
  call npm ci --no-audit --no-fund
) else (
  call npm install --no-audit --no-fund
)
if errorlevel 1 goto fail

echo [2/4] Running checks...
call npm test
if errorlevel 1 goto fail

echo [3/4] Cleaning old builds...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release

echo [4/4] Building Setup and Portable versions...
call npm run dist
if errorlevel 1 goto fail

echo.
echo ==========================================================
echo  DONE
echo  Setup:    release\DataDifferentiator-Setup.exe
echo  Portable: release\DataDifferentiator-Portable.exe
echo ==========================================================
start "" "%~dp0release"
pause
exit /b 0

:fail
echo.
echo Build failed. Scroll up to see the error message.
pause
exit /b 1
