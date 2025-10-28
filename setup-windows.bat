@echo off
REM Pixelabs Audio Processor - Windows Setup Script
REM This script will install and build the application automatically

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Pixelabs Audio Processor - Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Then run this setup script again.
    pause
    exit /b 1
)

echo Node.js is installed: %node --version%
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR:~0,-1%"

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building application...
call npm run build
if errorlevel 1 (
    echo Error: Failed to build application
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo The application has been built and is ready to use.
echo Executable location: %APP_DIR%\dist\Pixelabs Áudio Processor\
echo.
pause
