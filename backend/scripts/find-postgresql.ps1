# Find PostgreSQL Installation Script
# This script helps locate PostgreSQL installation on Windows

Write-Host ""
Write-Host "Searching for PostgreSQL installation..." -ForegroundColor Cyan
Write-Host ""

$commonPaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:ProgramFiles\PostgreSQL",
    "${env:ProgramFiles(x86)}\PostgreSQL"
)

$foundPaths = @()

foreach ($basePath in $commonPaths) {
    if (Test-Path $basePath) {
        $versions = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue
        foreach ($version in $versions) {
            $binPath = Join-Path $version.FullName "bin"
            $psqlPath = Join-Path $binPath "psql.exe"
            if (Test-Path $psqlPath) {
                $foundPaths += @{
                    Version = $version.Name
                    Path = $binPath
                    PsqlPath = $psqlPath
                }
                Write-Host "Found PostgreSQL:" -ForegroundColor Green
                Write-Host "  Version: $($version.Name)" -ForegroundColor White
                Write-Host "  Bin Path: $binPath" -ForegroundColor White
                Write-Host "  psql.exe: $psqlPath" -ForegroundColor White
                Write-Host ""
            }
        }
    }
}

if ($foundPaths.Count -eq 0) {
    Write-Host "PostgreSQL not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please do one of the following:" -ForegroundColor Cyan
    Write-Host "1. Add PostgreSQL bin folder to PATH environment variable" -ForegroundColor White
    Write-Host "2. Or run psql using full path" -ForegroundColor White
    Write-Host ""
    Write-Host "To find PostgreSQL:" -ForegroundColor Cyan
    Write-Host "- Check 'C:\Program Files\PostgreSQL\' folder" -ForegroundColor White
    Write-Host "- Or search for 'psql.exe' in File Explorer" -ForegroundColor White
} else {
    Write-Host "Using first found installation: $($foundPaths[0].Path)" -ForegroundColor Green
    
    # Add to PATH for current session
    $env:Path = "$($foundPaths[0].Path);$env:Path"
    
    Write-Host ""
    Write-Host "Testing connection..." -ForegroundColor Cyan
    
    # Test psql
    $psqlVersion = & "$($foundPaths[0].PsqlPath)" --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: $psqlVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run the database setup script!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Could not execute psql" -ForegroundColor Red
    }
}

Write-Host ""

