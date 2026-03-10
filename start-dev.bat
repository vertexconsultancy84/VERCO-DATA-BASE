@echo off
echo Starting VERTEX Development Server...
echo.

REM Set Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096

REM Clear any existing processes
taskkill /F /IM node.exe >nul 2>&1

REM Start the development server
echo Starting with increased memory and Turbopack disabled...
npm run dev

pause
