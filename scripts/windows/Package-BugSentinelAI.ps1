# ==============================================================================
# BugSentinel AI - Packaging Helper for Distribution to New Computers
# Packages the clean source code, configuration manifests, and Windows scripts
# into a transferable ZIP file while excluding transient/generated files.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$OutputZip = "BugSentinelAI-Release.zip"
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
if (-not $scriptDir -and $MyInvocation.PSCommandPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
}
. (Join-Path $scriptDir "common.ps1")

$ProjectRoot = Get-ProjectRoot
$DestinationZipPath = Join-Path $ProjectRoot $OutputZip

Write-Header "BugSentinel AI - Distribution Package Creator"

Write-Info "Project Root: $ProjectRoot"
Write-Info "Target Archive: $DestinationZipPath"

# Temp staging directory
$tempDir = Join-Path $env:TEMP ("BugSentinelAI_Staging_" + [guid]::NewGuid().ToString().Substring(0, 8))
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    Write-Step "1/3" "Staging distribution files..."

    # Define files and folders to include
    $itemsToCopy = @(
        "backend",
        "frontend",
        "scripts",
        "tests",
        "requirements.txt",
        ".env.example",
        ".gitignore",
        "README.md",
        "Install_BugSentinelAI.bat",
        "Start_BugSentinelAI.bat",
        "Stop_BugSentinelAI.bat"
    )

    foreach ($item in $itemsToCopy) {
        $sourcePath = Join-Path $ProjectRoot $item
        if (Test-Path $sourcePath) {
            $destPath = Join-Path $tempDir $item
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Success "Staged $item"
        } else {
            Write-WarnMsg "Optional item not found: $item"
        }
    }

    # Clean out generated/transient files from the staging copy
    Write-Step "2/3" "Pruning transient artifacts from staging copy..."

    $prunePatterns = @(
        "$tempDir\frontend\node_modules",
        "$tempDir\frontend\dist",
        "$tempDir\**\__pycache__",
        "$tempDir\**\.pytest_cache",
        "$tempDir\**\*.pyc",
        "$tempDir\logs",
        "$tempDir\data\runtime",
        "$tempDir\data\artifacts",
        "$tempDir\data\installation-state.json"
    )

    foreach ($pattern in $prunePatterns) {
        Get-Item -Path $pattern -Force -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Write-Info "Pruned $(Split-Path $_.FullName -Leaf)"
        }
    }

    # Create empty data directory with placeholder to preserve structure
    $stagedData = Join-Path $tempDir "data"
    if (-not (Test-Path $stagedData)) {
        New-Item -ItemType Directory -Path $stagedData -Force | Out-Null
    }
    Set-Content -Path (Join-Path $stagedData ".gitkeep") -Value "" -Encoding ASCII

    # Compress into distribution ZIP
    Write-Step "3/3" "Compressing into $OutputZip..."
    if (Test-Path $DestinationZipPath) {
        Remove-Item $DestinationZipPath -Force
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    if ([System.Type]::GetType("System.IO.Compression.ZipFile")) {
        [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $DestinationZipPath)
    } else {
        Compress-Archive -Path "$tempDir\*" -DestinationPath $DestinationZipPath -Force
    }

    $zipSizeMB = [math]::Round((Get-Item $DestinationZipPath).Length / 1MB, 2)

    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  Distribution archive created successfully: $OutputZip ($zipSizeMB MB)" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "Location: $DestinationZipPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instructions for the recipient computer:" -ForegroundColor White
    Write-Host "  1. Extract $OutputZip to any Windows directory (e.g., Desktop or C:\)." -ForegroundColor Gray
    Write-Host "  2. Double-click Install_BugSentinelAI.bat to setup dependencies." -ForegroundColor Gray
    Write-Host "  3. Double-click Start_BugSentinelAI.bat to launch." -ForegroundColor Gray
    Write-Host ""

} finally {
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
