@echo off
REM AI Task Assistant Desktop Launcher (No Console) for Windows
REM This script silently delegates to a VBScript that opens the popup as a true app window.

setlocal
set "VBS=%~dp0ai-task-assistant.vbs"

REM Optional: verify client dev server is up (quick, silent). If not, still attempt to open.
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5173/popup.html' -UseBasicParsing -TimeoutSec 2 } catch { }" >nul 2>&1

REM Launch via WScript (no console window)
start "" wscript.exe "%VBS%"

endlocal
exit /b 0