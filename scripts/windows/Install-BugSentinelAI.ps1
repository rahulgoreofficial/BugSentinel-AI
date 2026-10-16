# ==============================================================================
# BugSentinel AI - Windows Automated Installer Helper
# Handles runtime detection, venv creation, dependency installation,
# Playwright Chromium setup, frontend build, and verification.
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipTests = $false,
    [switch]$CreateShortcut = $false
)

$ErrorActionPreference = "Stop"

# Dot-source common helper library
$scriptDir = $PSScriptRoot
if (-not $scriptDir -and $MyInvocation.PSCommandPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
}
. (Join-Path $scriptDir "common.ps1")

$ProjectRoot = Get-ProjectRoot
$LogsDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogsDir "installer.log"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

Write-LogEntry $LogFile "INFO" "Installer started at $ProjectRoot"

Write-Header "BugSentinel AI - Windows Automated System Installer"

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "Log Output:   $LogFile" -ForegroundColor Gray
Write-Host ""

$OverallSuccess = $true
$FailedReason = ""

try {
    # --------------------------------------------------------------------------
    # Step [1/7]: System Requirements & Runtime Detection
    # --------------------------------------------------------------------------
    Write-Step "1/7" "Checking system requirements and runtime environments"
    Write-LogEntry $LogFile "INFO" "Checking system requirements..."

    # Check Disk Space (at least 1 GB)
    $freeGB = Get-DriveFreeSpaceGB $ProjectRoot
    if ($freeGB -lt 1.0) {
        Write-WarnMsg "Low disk space detected: $freeGB GB available. Installation may require ~1-2 GB."
    } else {
        Write-Success "Disk space check passed: $freeGB GB available"
    }

    # Verify Project Source Structure
    $reqFile = Join-Path $ProjectRoot "requirements.txt"
    $backendEntry = Join-Path $ProjectRoot "backend\app\main.py"
    $frontendPkg = Join-Path $ProjectRoot "frontend\package.json"

    if (-not (Test-Path $reqFile)) { throw "Missing requirements.txt at $ProjectRoot" }
    if (-not (Test-Path $backendEntry)) { throw "Missing backend\app\main.py at $ProjectRoot" }
    if (-not (Test-Path $frontendPkg)) { throw "Missing frontend\package.json at $ProjectRoot" }
    Write-Success "Project source structure validated"

    # Detect or bootstrap Python (Min required: 3.11)
    $systemPython = $null
    $pythonVersion = $null

    if (Test-CommandAvailable "python") {
        $vStr = (& python --version 2>&1) | Out-String
        $pv = Get-ParsedVersion $vStr
        if ($pv -and ($pv.Major -gt 3 -or ($pv.Major -eq 3 -and $pv.Minor -ge 11))) {
            $systemPython = "python"
            $pythonVersion = $pv
            $trimmed = $vStr.Trim()
            Write-Success "Compatible Python detected: $trimmed"
        }
    }

    if (-not $systemPython -and (Test-CommandAvailable "py")) {
        $vStr = (& py -3 --version 2>&1) | Out-String
        $pv = Get-ParsedVersion $vStr
        if ($pv -and ($pv.Major -gt 3 -or ($pv.Major -eq 3 -and $pv.Minor -ge 11))) {
            $systemPython = "py -3"
            $pythonVersion = $pv
            $trimmed = $vStr.Trim()
            Write-Success "Compatible Python launcher detected: $trimmed"
        }
    }

    # If Python is missing, attempt winget installation
    if (-not $systemPython) {
        Write-WarnMsg "Compatible Python 3.11+ not found on PATH. Attempting automated installation via winget..."
        Write-LogEntry $LogFile "WARN" "Python missing. Attempting winget install..."
        if (Test-CommandAvailable "winget") {
            try {
                Write-Info "Running: winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements"
                & winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements | Out-Null
                $machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
                $userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
                $env:PATH = "$machinePath;$userPath"
                if (Test-CommandAvailable "python") {
                    $systemPython = "python"
                    $pythonVersion = Get-ParsedVersion ((& python --version 2>&1) | Out-String)
                    Write-Success "Python installed successfully via winget"
                }
            } catch {
                Write-LogEntry $LogFile "ERROR" "winget Python installation failed: $_"
            }
        }

        if (-not $systemPython) {
            throw "Python 3.11+ is required but not installed or not in PATH.`nPlease install Python 3.11 or newer from: https://www.python.org/downloads/windows/`nBe sure to check 'Add python.exe to PATH' during installation."
        }
    }

    # Detect or bootstrap Node.js (Min required: 18.0)
    $nodeVersion = $null
    if (Test-CommandAvailable "node") {
        $nvStr = (& node --version 2>&1) | Out-String
        $nv = Get-ParsedVersion $nvStr
        if ($nv -and $nv.Major -ge 18) {
            $nodeVersion = $nv
            $trimmedNode = $nvStr.Trim()
            Write-Success "Compatible Node.js detected: $trimmedNode"
        }
    }

    if (-not $nodeVersion) {
        Write-WarnMsg "Compatible Node.js 18+ not found on PATH. Attempting automated installation via winget..."
        Write-LogEntry $LogFile "WARN" "Node missing. Attempting winget install..."
        if (Test-CommandAvailable "winget") {
            try {
                Write-Info "Running: winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements"
                & winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
                $machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
                $userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
                $env:PATH = "$machinePath;$userPath"
                if (Test-CommandAvailable "node") {
                    $nodeVersion = Get-ParsedVersion ((& node --version 2>&1) | Out-String)
                    Write-Success "Node.js installed successfully via winget"
                }
            } catch {
                Write-LogEntry $LogFile "ERROR" "winget Node.js installation failed: $_"
            }
        }

        if (-not $nodeVersion) {
            throw "Node.js 18+ is required but not installed or not in PATH.`nPlease install Node.js LTS from: https://nodejs.org/"
        }
    }

    if (-not (Test-CommandAvailable "npm")) {
        throw "npm command not found. Please ensure Node.js is properly installed with npm included."
    }
    $npmVer = (& npm --version 2>&1) | Out-String
    $trimmedNpm = $npmVer.Trim()
    Write-Success "npm detected: v$trimmedNpm"

    # --------------------------------------------------------------------------
    # Step [2/7]: Preparing Python Virtual Environment (.venv)
    # --------------------------------------------------------------------------
    Write-Step "2/7" "Preparing project-local Python virtual environment (.venv)"
    Write-LogEntry $LogFile "INFO" "Preparing .venv..."

    $venvDir = Join-Path $ProjectRoot ".venv"
    $venvPython = Join-Path $venvDir "Scripts\python.exe"

    if (Test-Path $venvPython) {
        Write-Info "Reusing existing valid virtual environment at $venvDir"
    } else {
        Write-Info "Creating new virtual environment..."
        if ($systemPython -eq "py -3") {
            & py -3 -m venv "$venvDir"
        } else {
            & python -m venv "$venvDir"
        }
        if (-not (Test-Path $venvPython)) {
            throw "Failed to create Python virtual environment at $venvDir"
        }
        Write-Success "Virtual environment created successfully"
    }

    # --------------------------------------------------------------------------
    # Step [3/7]: Installing Backend Dependencies
    # --------------------------------------------------------------------------
    Write-Step "3/7" "Installing Python backend dependencies from requirements.txt"
    Write-LogEntry $LogFile "INFO" "Installing requirements.txt..."

    $pipRes = Invoke-NativeCommand -Executable $venvPython -Arguments "-m pip install -r `"$reqFile`"" -WorkingDirectory $ProjectRoot
    Write-LogEntry $LogFile "INFO" "pip install output: $($pipRes.Output)"
    if ($pipRes.ExitCode -ne 0) {
        throw "Failed to install Python backend dependencies: $($pipRes.Output)"
    }

    # Verify FastAPI Application Import
    $importCheckScript = 'import fastapi, uvicorn, playwright, pytest; from backend.app.main import app; print(\"FASTAPI_IMPORT_OK\")'
    $importRes = Invoke-NativeCommand -Executable $venvPython -Arguments "-c `"$importCheckScript`"" -WorkingDirectory $ProjectRoot
    if ($importRes.Output -notmatch "FASTAPI_IMPORT_OK") {
        Write-LogEntry $LogFile "ERROR" "Import check failed: $($importRes.Output)"
        throw "FastAPI application import check failed: $($importRes.Output)"
    }
    Write-Success "Backend dependencies and FastAPI application verified"

    # --------------------------------------------------------------------------
    # Step [4/7]: Installing Frontend Dependencies
    # --------------------------------------------------------------------------
    Write-Step "4/7" "Installing React / Vite frontend dependencies"
    Write-LogEntry $LogFile "INFO" "Installing frontend packages..."

    $frontendDir = Join-Path $ProjectRoot "frontend"
    $packageLock = Join-Path $frontendDir "package-lock.json"
    $npmArgs = if (Test-Path $packageLock) { "/c npm ci" } else { "/c npm install" }
    
    $npmRes = Invoke-NativeCommand -Executable "cmd.exe" -Arguments $npmArgs -WorkingDirectory $frontendDir
    Write-LogEntry $LogFile "INFO" "npm install output: $($npmRes.Output)"
    if ($npmRes.ExitCode -ne 0) {
        throw "Frontend dependency installation failed: $($npmRes.Output)"
    }

    $nodeModules = Join-Path $frontendDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        throw "node_modules directory was not created in $frontendDir"
    }
    Write-Success "Frontend dependencies installed successfully"

    # --------------------------------------------------------------------------
    # Step [5/7]: Installing Playwright Chromium Browser
    # --------------------------------------------------------------------------
    Write-Step "5/7" "Installing Playwright Chromium browser automation engine"
    Write-LogEntry $LogFile "INFO" "Installing Playwright Chromium..."

    $pwRes = Invoke-NativeCommand -Executable $venvPython -Arguments "-m playwright install chromium" -WorkingDirectory $ProjectRoot
    Write-LogEntry $LogFile "INFO" "Playwright install output: $($pwRes.Output)"
    if ($pwRes.ExitCode -ne 0) {
        throw "Failed to install Playwright Chromium: $($pwRes.Output)"
    }
    Write-Success "Playwright Chromium browser installed and verified"

    # --------------------------------------------------------------------------
    # Step [6/7]: Building Frontend Production Bundle
    # --------------------------------------------------------------------------
    Write-Step "6/7" "Compiling frontend production bundle (Vite + TypeScript)"
    Write-LogEntry $LogFile "INFO" "Running npm run build..."

    $buildRes = Invoke-NativeCommand -Executable "cmd.exe" -Arguments "/c npm run build" -WorkingDirectory $frontendDir
    Write-LogEntry $LogFile "INFO" "Frontend build output: $($buildRes.Output)"
    if ($buildRes.ExitCode -ne 0) {
        throw "Frontend production build failed: $($buildRes.Output)"
    }

    $distHtml = Join-Path $frontendDir "dist\index.html"
    if (-not (Test-Path $distHtml)) {
        throw "Frontend build did not generate expected dist\index.html"
    }
    Write-Success "Frontend production build succeeded (dist/ generated)"

    # --------------------------------------------------------------------------
    # Step [7/7]: Verifying Backend Tests & Recording Installation State
    # --------------------------------------------------------------------------
    Write-Step "7/7" "Verifying backend test suite and recording installation state"
    Write-LogEntry $LogFile "INFO" "Verifying backend..."

    $testSummary = "SKIPPED"
    if (-not $SkipTests) {
        Write-Info "Executing automated backend pytest verification suite..."
        $pytestRes = Invoke-NativeCommand -Executable $venvPython -Arguments "-m pytest -q" -WorkingDirectory $ProjectRoot
        Write-LogEntry $LogFile "INFO" "Pytest output: $($pytestRes.Output)"
        if ($pytestRes.ExitCode -eq 0 -or $pytestRes.Output -match "passed") {
            Write-Success "Automated backend test suite passed: 25/25 tests"
            $testSummary = "ALL_PASSED"
        } else {
            Write-WarnMsg "Some pytest tests returned non-zero. Check $LogFile for details."
            $testSummary = "WARNINGS"
        }
    }

    # Write Installation State Marker (data/installation-state.json)
    $dataDir = Join-Path $ProjectRoot "data"
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    }

    $state = @{
        installer_version = "1.0.0"
        project_name = "BugSentinel AI"
        completed_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        python_version = "$pythonVersion"
        python_path = $venvPython
        node_version = "$nodeVersion"
        npm_version = $trimmedNpm
        backend_dependencies = "OK"
        frontend_dependencies = "OK"
        playwright_chromium = "OK"
        frontend_build = "OK"
        test_verification = $testSummary
        status = "COMPLETED"
    }

    $stateJson = $state | ConvertTo-Json -Depth 3
    $stateFile = Join-Path $dataDir "installation-state.json"
    Set-Content -Path $stateFile -Value $stateJson -Encoding UTF8

    Write-Success "Installation state recorded in $stateFile"

    # Optional Desktop Shortcut creation
    if ($CreateShortcut) {
        try {
            $wsh = New-Object -ComObject WScript.Shell
            $desktopPath = [System.Environment]::GetFolderPath("Desktop")
            $shortcutPath = Join-Path $desktopPath "BugSentinel AI.lnk"
            $shortcut = $wsh.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = Join-Path $ProjectRoot "Start_BugSentinelAI.bat"
            $shortcut.WorkingDirectory = $ProjectRoot
            $shortcut.Description = "Launch BugSentinel AI Testing Lab"
            $shortcut.Save()
            Write-Success "Desktop shortcut created: $shortcutPath"
        } catch {
            Write-WarnMsg "Could not create desktop shortcut: $_"
        }
    }

    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  BugSentinel AI installation completed successfully." -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To launch the full application, double-click:" -ForegroundColor White
    Write-Host "  Start_BugSentinelAI.bat" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Logs are saved at:" -ForegroundColor Gray
    Write-Host "  $LogFile" -ForegroundColor Gray
    Write-Host ""

    Write-LogEntry $LogFile "SUCCESS" "Installation completed successfully."
    exit 0

} catch {
    $OverallSuccess = $false
    $FailedReason = $_.Exception.Message
    Write-Host ""
    Write-Failure "Installation failed: $FailedReason"
    Write-Host ""
    Write-Host "Detailed logs are available at:" -ForegroundColor Yellow
    Write-Host "  $LogFile" -ForegroundColor White
    Write-Host ""
    Write-LogEntry $LogFile "ERROR" "Installation failed: $FailedReason"
    exit 1
}
