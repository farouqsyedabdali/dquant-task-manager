@echo off
REM AI Task Assistant Desktop Launcher for Windows
REM 
REM This batch file opens the AI Task Assistant in a small popup window.
REM 
REM Usage:
REM   1. Double-click this file
REM   2. Or create a desktop shortcut to this file
REM   3. Or run from command line: ai-task-assistant.bat
REM

title AI Task Assistant Launcher

echo 🤖 AI Task Assistant Desktop Launcher
echo =====================================
echo.



REM Configuration
set LAUNCHER_URL=http://localhost:5173/popup-launcher.html

echo 🔍 Checking if Task Manager server is running...

REM Simple check if server is running using curl or PowerShell
powershell -Command "try { $response = Invoke-WebRequest -Uri '%LAUNCHER_URL%' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop; Write-Host '✅ Task Manager server is running' } catch { Write-Host '❌ Task Manager server is not running!'; Write-Host ''; Write-Host 'Please start your development server first:'; Write-Host '   cd client'; Write-Host '   npm run dev'; Write-Host ''; pause; exit 1 }"

if %ERRORLEVEL% neq 0 (
    echo Server check failed
    pause
    exit /b 1
)

echo.
echo 🚀 Opening AI Task Assistant Launcher...
echo 🌐 URL: %LAUNCHER_URL%
echo.

REM Open launcher page
echo 🌐 Opening launcher in browser...
start "" "%LAUNCHER_URL%"

REM Give it a moment to start
timeout /t 2 /nobreak >nul

echo.
echo ✅ Launcher opened! Click "Launch AI Assistant" to open the popup.
echo.
echo 📝 How to use:
echo    1. Click "Launch AI Assistant" on the launcher page
echo    2. A 256x256 popup window will open
echo    3. Copy text and use Create/Update Task buttons
echo    4. Task manager will open in regular tabs
echo.
echo 💡 Tip: Bookmark the launcher for easy access!
echo.
echo Press any key to close this launcher window...
pause >nul 