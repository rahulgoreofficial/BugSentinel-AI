# ==============================================================================
# BugSentinel AI - Windows Automation Common Helper Library
# Provides shared path resolution, logging, runtime checks, and process tracking.
# ==============================================================================

$ErrorActionPreference = "Stop"

# Resolve Project Root safely
function Get-ProjectRoot {
    $dir = $PSScriptRoot
    if (-not $dir -and $MyInvocation.PSCommandPath) {
        $dir = Split-Path -Parent $MyInvocation.PSCommandPath
    }
    if (-not $dir) {
        $dir = (Get-Location).Path
    }
    
    # Climb up to find directory containing requirements.txt and frontend/package.json
    $curr = $dir
    while ($curr -and (Test-Path $curr)) {
        if ((Test-Path (Join-Path $curr "requirements.txt")) -and (Test-Path (Join-Path $curr "frontend\package.json"))) {
            return (Resolve-Path $curr).Path
        }
        $parent = Split-Path -Parent $curr
        if ($parent -eq $curr) { break }
        $curr = $parent
    }
    return (Resolve-Path (Join-Path $dir "..\..")).Path
}

# Run native command safely without NativeCommandError on stderr
function Invoke-NativeCommand {
    param(
        [string]$Executable,
        [string]$Arguments = "",
        [string]$WorkingDirectory = ""
    )
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $Executable
    $pinfo.Arguments = $Arguments
    if ($WorkingDirectory) {
        $pinfo.WorkingDirectory = $WorkingDirectory
    }
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    [void]$p.Start()

    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()

    return [PSCustomObject]@{
        ExitCode = $p.ExitCode
        Output = ($stdout + "`n" + $stderr).Trim()
    }
}

# Terminal Output Formatting
function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Step {
    param(
        [string]$StepNumber,
        [string]$Message
    )
    Write-Host "[$StepNumber] " -ForegroundColor Cyan -NoNewline
    Write-Host "$Message..." -ForegroundColor White
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] " -ForegroundColor Green -NoNewline
    Write-Host "$Message" -ForegroundColor Gray
}

function Write-Info {
    param([string]$Message)
    Write-Host "  [INFO] " -ForegroundColor Blue -NoNewline
    Write-Host "$Message" -ForegroundColor Gray
}

function Write-WarnMsg {
    param([string]$Message)
    Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
    Write-Host "$Message" -ForegroundColor Yellow
}

function Write-Failure {
    param([string]$Message)
    Write-Host "  [ERROR] " -ForegroundColor Red -NoNewline
    Write-Host "$Message" -ForegroundColor Red
}

# Append formatted message to log file
function Write-LogEntry {
    param(
        [string]$LogPath,
        [string]$Level,
        [string]$Message
    )
    if ([string]::IsNullOrWhiteSpace($LogPath)) { return }
    $dir = Split-Path -Parent $LogPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $logLine = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogPath -Value $logLine -Encoding UTF8 -ErrorAction SilentlyContinue
}

# Test if an executable command is available in PATH
function Test-CommandAvailable {
    param([string]$CommandName)
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    return ($null -ne $cmd)
}

# Extract Semantic Version from command output
function Get-ParsedVersion {
    param([string]$RawString)
    if ($RawString -match '(\d+\.\d+(\.\d+)?)') {
        try {
            return [version]$matches[1]
        } catch {
            return $null
        }
    }
    return $null
}

# Check disk space on target drive (in GB)
function Get-DriveFreeSpaceGB {
    param([string]$Path)
    try {
        $root = [System.IO.Path]::GetPathRoot((Resolve-Path $Path).Path)
        $driveLetter = $root.Substring(0, 1)
        $drive = Get-PSDrive -Name $driveLetter -ErrorAction SilentlyContinue
        if ($drive) {
            return [math]::Round($drive.Free / 1GB, 2)
        }
    } catch {}
    return 999.0
}

# Test HTTP endpoint readiness with timeout
function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 3
    )
    try {
        $req = [System.Net.HttpWebRequest]::Create($Url)
        $req.Timeout = $TimeoutSeconds * 1000
        $req.Method = "GET"
        $resp = $req.GetResponse()
        $statusCode = [int]$resp.StatusCode
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()
        return @{
            Success = ($statusCode -ge 200 -and $statusCode -lt 400)
            StatusCode = $statusCode
            Content = $content
        }
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            return @{ Success = ($code -ge 200 -and $code -lt 400); StatusCode = $code; Content = "" }
        }
        return @{ Success = $false; StatusCode = 0; Content = $_.Exception.Message }
    } catch {
        return @{ Success = $false; StatusCode = 0; Content = $_.Exception.Message }
    }
}

# Check if a TCP port is in Listen state
function Test-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

# Get Process details owning a local port
function Get-PortOwningProcess {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn -and $conn.OwningProcess) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        return @{
            Port = $Port
            PID = $conn.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
        }
    }
    return $null
}

# Safe Process Tracking for BugSentinel AI
function Save-ProcessTracking {
    param(
        [string]$ProjectRoot,
        [int]$BackendPID,
        [int]$FrontendPID,
        [int]$BackendPort = 8000,
        [int]$FrontendPort = 5173
    )
    $runtimeDir = Join-Path $ProjectRoot "data\runtime"
    if (-not (Test-Path $runtimeDir)) {
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    }

    $tracking = @{
        started_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        backend_pid = $BackendPID
        frontend_pid = $FrontendPID
        backend_port = $BackendPort
        frontend_port = $FrontendPort
        app_url = "http://127.0.0.1:$FrontendPort/#dashboard"
    }

    $json = $tracking | ConvertTo-Json -Depth 3
    $trackingFile = Join-Path $runtimeDir "processes.json"
    Set-Content -Path $trackingFile -Value $json -Encoding UTF8

    # Also write individual pid files for quick utility access
    Set-Content -Path (Join-Path $runtimeDir "backend.pid") -Value $BackendPID -Encoding ASCII
    Set-Content -Path (Join-Path $runtimeDir "frontend.pid") -Value $FrontendPID -Encoding ASCII
}

function Get-ProcessTracking {
    param([string]$ProjectRoot)
    $trackingFile = Join-Path $ProjectRoot "data\runtime\processes.json"
    if (Test-Path $trackingFile) {
        try {
            $content = Get-Content -Path $trackingFile -Raw
            return ($content | ConvertFrom-Json)
        } catch {}
    }
    return $null
}

function Clear-ProcessTracking {
    param([string]$ProjectRoot)
    $runtimeDir = Join-Path $ProjectRoot "data\runtime"
    if (Test-Path $runtimeDir) {
        Remove-Item (Join-Path $runtimeDir "processes.json") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $runtimeDir "backend.pid") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $runtimeDir "frontend.pid") -ErrorAction SilentlyContinue
    }
}

