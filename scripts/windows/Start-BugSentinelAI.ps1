# ==============================================================================
# BugSentinel AI - Windows Automated Launcher Helper
# Starts FastAPI backend and Vite frontend together, performs readiness checks,
# opens the browser to the operational lab, and handles clean shutdown.
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$NoBrowser = $false,
    [switch]$Detached = $false,
    [string]$AppUrl = "http://127.0.0.1:5173/#dashboard",
    [int]$StartupTimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
if (-not $scriptDir -and $MyInvocation.PSCommandPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
}
. (Join-Path $scriptDir "common.ps1")

$ProjectRoot = Get-ProjectRoot
$LogsDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogsDir "launcher.log"
$BackendLog = Join-Path $LogsDir "backend.log"
$BackendErrLog = Join-Path $LogsDir "backend_err.log"
$FrontendLog = Join-Path $LogsDir "frontend.log"
$FrontendErrLog = Join-Path $LogsDir "frontend_err.log"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

Write-Header "BugSentinel AI - Full-Stack Application Launcher"

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "Launcher Log: $LogFile" -ForegroundColor Gray
Write-Host ""

Write-LogEntry $LogFile "INFO" "Launcher started at $ProjectRoot"

# ------------------------------------------------------------------------------
# 1. Verify Installation State
# ------------------------------------------------------------------------------
Write-Step "1/5" "Verifying installation prerequisites"
$venvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$frontendDir = Join-Path $ProjectRoot "frontend"
$nodeModules = Join-Path $frontendDir "node_modules"
$stateFile = Join-Path $ProjectRoot "data\installation-state.json"

if (-not (Test-Path $stateFile)) {
    Write-WarnMsg "Installation record (data\installation-state.json) not found."
    Write-Host "If this is the first run on this system, please run Install_BugSentinelAI.bat first." -ForegroundColor Yellow
    Write-Host ""
}

if (-not (Test-Path $venvPython)) {
    Write-Failure "Python virtual environment not found (.venv\Scripts\python.exe is missing)."
    Write-Host ""
    Write-Host "Please run the automated installer first by double-clicking:" -ForegroundColor Yellow
    Write-Host "  Install_BugSentinelAI.bat" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

if (-not (Test-CommandAvailable "node")) {
    Write-Failure "Node.js was not detected on PATH."
    Write-Host ""
    Write-Host "Please run the automated installer first by double-clicking:" -ForegroundColor Yellow
    Write-Host "  Install_BugSentinelAI.bat" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

if (-not (Test-CommandAvailable "npm")) {
    Write-Failure "npm was not detected on PATH."
    Write-Host ""
    Write-Host "Please run the automated installer first by double-clicking:" -ForegroundColor Yellow
    Write-Host "  Install_BugSentinelAI.bat" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

if (-not (Test-Path $nodeModules)) {
    Write-Failure "Frontend dependencies not found (frontend\node_modules is missing)."
    Write-Host ""
    Write-Host "Please run the automated installer first by double-clicking:" -ForegroundColor Yellow
    Write-Host "  Install_BugSentinelAI.bat" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Success "Virtual environment, Node.js, and frontend dependencies verified"

# ------------------------------------------------------------------------------
# 2. Check for Existing Running Instance & Port Conflicts
# ------------------------------------------------------------------------------
Write-Step "2/5" "Checking for existing instances and port availability"

$backendHealthy = (Test-HttpEndpoint "http://127.0.0.1:8000/api/health" -TimeoutSeconds 2).Success
$frontendHealthy = (Test-HttpEndpoint "http://127.0.0.1:5173/" -TimeoutSeconds 2).Success

if ($backendHealthy -and $frontendHealthy) {
    Write-Success "BugSentinel AI is already running and fully operational!"
    Write-Info "Opening application in your default browser..."
    if (-not $NoBrowser) {
        Start-Process $AppUrl
    }
    Write-Host ""
    Write-Host "Application URL: $AppUrl" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Check for port conflicts (port occupied by unrelated process)
if (Test-PortInUse 8000) {
    $owner = Get-PortOwningProcess 8000
    Write-Failure "Port 8000 is already in use by process PID $($owner.PID) ($($owner.ProcessName))."
    Write-Host "Please close this conflicting process or run Stop_BugSentinelAI.bat before launching." -ForegroundColor Yellow
    exit 1
}

if (Test-PortInUse 5173) {
    $owner = Get-PortOwningProcess 5173
    Write-Failure "Port 5173 is already in use by process PID $($owner.PID) ($($owner.ProcessName))."
    Write-Host "Please close this conflicting process or run Stop_BugSentinelAI.bat before launching." -ForegroundColor Yellow
    exit 1
}

Write-Success "Ports 8000 and 5173 are available"

# ------------------------------------------------------------------------------
# 3. Launch Backend & Frontend Services
# ------------------------------------------------------------------------------
Write-Step "3/5" "Starting BugSentinel AI backend and frontend services"
Write-LogEntry $LogFile "INFO" "Starting backend process..."

# Clear old service logs
Set-Content -Path $BackendLog -Value "=== BugSentinel AI Backend Stdout $(Get-Date) ===`r`n" -Encoding UTF8
Set-Content -Path $BackendErrLog -Value "=== BugSentinel AI Backend Stderr $(Get-Date) ===`r`n" -Encoding UTF8
Set-Content -Path $FrontendLog -Value "=== BugSentinel AI Frontend Stdout $(Get-Date) ===`r`n" -Encoding UTF8
Set-Content -Path $FrontendErrLog -Value "=== BugSentinel AI Frontend Stderr $(Get-Date) ===`r`n" -Encoding UTF8

# Start Backend Process
$backendProc = Start-Process `
    -FilePath $venvPython `
    -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000" `
    -WorkingDirectory $ProjectRoot `
    -RedirectStandardOutput $BackendLog `
    -RedirectStandardError $BackendErrLog `
    -PassThru `
    -WindowStyle Hidden

Write-Info "FastAPI backend started (PID $($backendProc.Id))"
Write-LogEntry $LogFile "INFO" "Backend process started with PID $($backendProc.Id)"

# Start Frontend Process
Write-LogEntry $LogFile "INFO" "Starting frontend process..."
$frontendProc = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev -- --host 127.0.0.1 --port 5173 --strictPort" `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $FrontendLog `
    -RedirectStandardError $FrontendErrLog `
    -PassThru `
    -WindowStyle Hidden

Write-Info "Vite React frontend started (PID $($frontendProc.Id))"
Write-LogEntry $LogFile "INFO" "Frontend process started with PID $($frontendProc.Id)"

# Save Process Tracking Information
Save-ProcessTracking `
    -ProjectRoot $ProjectRoot `
    -BackendPID $backendProc.Id `
    -FrontendPID $frontendProc.Id `
    -BackendPort 8000 `
    -FrontendPort 5173

# Function to clean up on startup failure
function Stop-StartedServices {
    Write-WarnMsg "Stopping launched processes due to startup failure..."
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        try {
            & taskkill /PID $frontendProc.Id /T /F 2>&1 | Out-Null
        } catch {
            Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Clear-ProcessTracking $ProjectRoot
}

# ------------------------------------------------------------------------------
# 4. Readiness Health Checks (Bounded Timeout)
# ------------------------------------------------------------------------------
Write-Step "4/5" "Waiting for backend and frontend readiness (timeout: ${StartupTimeoutSeconds}s)"

$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$backendReady = $false
$frontendReady = $false

while ($startTime.Elapsed.TotalSeconds -lt $StartupTimeoutSeconds) {
    # Check if processes crashed
    if ($backendProc.HasExited) {
        Stop-StartedServices
        Write-Failure "Backend process exited prematurely with code $($backendProc.ExitCode)!"
        Write-Host "Recent backend log entries ($BackendLog / $BackendErrLog):" -ForegroundColor Yellow
        Get-Content $BackendLog -Tail 10 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        Get-Content $BackendErrLog -Tail 15 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        exit 1
    }

    if ($frontendProc.HasExited) {
        Stop-StartedServices
        Write-Failure "Frontend process exited prematurely with code $($frontendProc.ExitCode)!"
        Write-Host "Recent frontend log entries ($FrontendLog / $FrontendErrLog):" -ForegroundColor Yellow
        Get-Content $FrontendLog -Tail 10 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        Get-Content $FrontendErrLog -Tail 15 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        exit 1
    }

    # Test backend health endpoint
    if (-not $backendReady) {
        $res = Test-HttpEndpoint "http://127.0.0.1:8000/api/health" -TimeoutSeconds 1
        if ($res.Success -and $res.Content -match '"status"\s*:\s*"ok"') {
            $backendReady = $true
            Write-Success "Backend online: http://127.0.0.1:8000/api/health (200 OK)"
            Write-LogEntry $LogFile "INFO" "Backend health confirmed."
        }
    }

    # Test frontend HTTP readiness
    if (-not $frontendReady) {
        $fRes = Test-HttpEndpoint "http://127.0.0.1:5173/" -TimeoutSeconds 1
        if ($fRes.Success) {
            $frontendReady = $true
            Write-Success "Frontend ready: http://127.0.0.1:5173/ (200 OK)"
            Write-LogEntry $LogFile "INFO" "Frontend readiness confirmed."
        }
    }

    if ($backendReady -and $frontendReady) {
        break
    }

    Start-Sleep -Milliseconds 800
}

if (-not ($backendReady -and $frontendReady)) {
    Stop-StartedServices
    Write-Failure "Timed out waiting for services to become ready within ${StartupTimeoutSeconds} seconds."
    Write-Host "Please inspect logs for details:" -ForegroundColor Yellow
    Write-Host "  Backend Log:  $BackendLog" -ForegroundColor White
    Write-Host "  Frontend Log: $FrontendLog" -ForegroundColor White
    exit 1
}

# ------------------------------------------------------------------------------
# 5. Open Browser & Display Running Status
# ------------------------------------------------------------------------------
Write-Step "5/5" "Opening BugSentinel AI in your default browser"

if (-not $NoBrowser) {
    try {
        Start-Process $AppUrl
        Write-Success "Opened $AppUrl"
    } catch {
        Write-WarnMsg "Could not automatically launch browser. Please navigate to: $AppUrl"
    }
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  BugSentinel AI is RUNNING." -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  * Testing Lab (Frontend):   " -NoNewline
Write-Host "$AppUrl" -ForegroundColor Cyan
Write-Host "  * Target App (ShopDemo):     " -NoNewline
Write-Host "http://127.0.0.1:8000/demo/" -ForegroundColor Cyan
Write-Host "  * OpenAPI Documentation:     " -NoNewline
Write-Host "http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "  * Backend Logs:              " -NoNewline
Write-Host "$BackendLog" -ForegroundColor Gray
Write-Host "  * Frontend Logs:             " -NoNewline
Write-Host "$FrontendLog" -ForegroundColor Gray
Write-Host ""
Write-Host "To shut down all services cleanly, press Ctrl+C in this window" -ForegroundColor Yellow
Write-Host "or double-click Stop_BugSentinelAI.bat at any time." -ForegroundColor Yellow
Write-Host ""

Write-LogEntry $LogFile "SUCCESS" "BugSentinel AI running at $AppUrl"

if ($Detached) {
    exit 0
}

# Keep the window open and monitor processes until user presses Ctrl+C or closes window
try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-WarnMsg "Backend process terminated unexpectedly."
            break
        }
        if ($frontendProc.HasExited) {
            Write-WarnMsg "Frontend process terminated unexpectedly."
            break
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host ""
    Write-Info "Shutting down BugSentinel AI services..."
    Stop-StartedServices
    Write-Success "Shutdown complete."
}
