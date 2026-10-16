@echo off
setlocal enabledelayedexpansion

title BugSentinel AI - Full-Stack Launcher

cd /d "%~dp0"

echo ==============================================================================
echo   BugSentinel AI - Automated Application Launcher
echo ==============================================================================
echo.
echo Initializing application services...
echo Working Directory: "%~dp0"
echo.

where powershell.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Windows PowerShell is required but was not found.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Start-BugSentinelAI.ps1" %*
set SCRIPT_EXIT_CODE=%ERRORLEVEL%

if %SCRIPT_EXIT_CODE% neq 0 (
    echo.
    echo ==============================================================================
    echo   Launcher stopped with exit code %SCRIPT_EXIT_CODE%.
    echo   Please inspect the error messages above or check logs\launcher.log
    echo ==============================================================================
    echo.
    pause
)

exit /b %SCRIPT_EXIT_CODE%
