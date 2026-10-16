@echo off
setlocal enabledelayedexpansion

title BugSentinel AI - Automated System Installer

:: Change working directory to the directory containing this batch file
cd /d "%~dp0"

echo ==============================================================================
echo   BugSentinel AI - Automated Windows System Installer
echo ==============================================================================
echo.
echo Initializing installer environment...
echo Working Directory: "%~dp0"
echo.

:: Check for powershell.exe availability
where powershell.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Windows PowerShell is required to run this installer but was not found.
    echo Please ensure PowerShell is enabled on this system.
    echo.
    pause
    exit /b 1
)

:: Execute the PowerShell installer helper with process-scoped execution policy
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\Install-BugSentinelAI.ps1" %*
set SCRIPT_EXIT_CODE=%ERRORLEVEL%

echo.
if %SCRIPT_EXIT_CODE% equ 0 (
    echo ==============================================================================
    echo   Setup Completed. You may now close this window and run Start_BugSentinelAI.bat
    echo ==============================================================================
) else (
    echo ==============================================================================
    echo   Installer encountered an error [Exit Code: !SCRIPT_EXIT_CODE!].
    echo   Please inspect the error messages above or check logs\installer.log
    echo ==============================================================================
)

echo.
echo Press any key to exit...
pause >nul
exit /b %SCRIPT_EXIT_CODE%
