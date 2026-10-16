@echo off
setlocal enabledelayedexpansion

title BugSentinel AI - Stop Services

cd /d "%~dp0"

echo ==============================================================================
echo   BugSentinel AI - Stop Services
echo ==============================================================================
echo.

where powershell.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Windows PowerShell is required but was not found.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Stop-BugSentinelAI.ps1" %*

echo Press any key to exit...
pause >nul
exit /b 0
