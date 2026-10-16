# ==============================================================================
# BugSentinel AI - Windows Application Shutdown Helper
# Safely stops backend and frontend processes tracked by BugSentinel AI.
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"

$scriptDir = $PSScriptRoot
if (-not $scriptDir -and $MyInvocation.PSCommandPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
}
. (Join-Path $scriptDir "common.ps1")

$ProjectRoot = Get-ProjectRoot
$LogFile = Join-Path $ProjectRoot "logs\launcher.log"

Write-Header "BugSentinel AI - Application Shutdown"

Write-Info "Checking for running BugSentinel AI processes..."
Write-LogEntry $LogFile "INFO" "Shutdown initiated..."

$stoppedAny = $false

# 1. Stop tracked processes from data/runtime/processes.json
$tracking = Get-ProcessTracking $ProjectRoot

if ($tracking) {
    if ($tracking.backend_pid) {
        $bPid = [int]$tracking.backend_pid
        $proc = Get-Process -Id $bPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Info "Stopping backend process (PID $bPid, Name: $($proc.ProcessName))..."
            Stop-Process -Id $bPid -Force -ErrorAction SilentlyContinue
            Write-Success "Backend process stopped"
            $stoppedAny = $true
        }
    }

    if ($tracking.frontend_pid) {
        $fPid = [int]$tracking.frontend_pid
        $proc = Get-Process -Id $fPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Info "Stopping frontend process (PID $fPid, Name: $($proc.ProcessName))..."
            # Also stop any child node processes
            try {
                & taskkill /PID $fPid /T /F 2>&1 | Out-Null
            } catch {
                Stop-Process -Id $fPid -Force -ErrorAction SilentlyContinue
            }
            Write-Success "Frontend process stopped"
            $stoppedAny = $true
        }
    }

    Clear-ProcessTracking $ProjectRoot
}

# 2. Check ports 8000 and 5173 for remaining uvicorn / vite processes
$ports = @(8000, 5173)
foreach ($p in $ports) {
    $owner = Get-PortOwningProcess $p
    if ($owner) {
        $pName = $owner.ProcessName.ToLower()
        if ($pName -match "python" -or $pName -match "node" -or $pName -match "cmd") {
            Write-Info "Freeing port $p (PID $($owner.PID), Process: $($owner.ProcessName))..."
            try {
                & taskkill /PID $($owner.PID) /T /F 2>&1 | Out-Null
                Write-Success "Port $p released"
                $stoppedAny = $true
            } catch {
                Stop-Process -Id $($owner.PID) -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

if ($stoppedAny) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  All BugSentinel AI services have been stopped successfully." -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-LogEntry $LogFile "SUCCESS" "All services stopped."
} else {
    Write-Host ""
    Write-Host "No active BugSentinel AI services were found running." -ForegroundColor Gray
}

Write-Host ""
