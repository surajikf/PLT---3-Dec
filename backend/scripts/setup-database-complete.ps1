# Complete Database Setup Script
# This script finds PostgreSQL, connects, and creates the database

param(
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [string]$DbName = "plt_db"
)

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   IKF Project Livetracker - Database Setup" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL installation
Write-Host "[Step 1/6] Finding PostgreSQL installation..." -ForegroundColor Yellow
$psqlPath = $null

# Check if psql is in PATH
try {
    $testPsql = Get-Command psql -ErrorAction Stop
    $psqlPath = $testPsql.Source
    Write-Host "   Found: psql is in PATH" -ForegroundColor Green
} catch {
    # Search common installation paths
    $commonPaths = @(
        "C:\Program Files\PostgreSQL",
        "C:\Program Files (x86)\PostgreSQL"
    )
    
    foreach ($basePath in $commonPaths) {
        if (Test-Path $basePath) {
            $versions = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
            foreach ($version in $versions) {
                $testPath = Join-Path $version.FullName "bin\psql.exe"
                if (Test-Path $testPath) {
                    $psqlPath = $testPath
                    $env:Path = "$($version.FullName)\bin;$env:Path"
                    Write-Host "   Found: $testPath" -ForegroundColor Green
                    break
                }
            }
            if ($psqlPath) { break }
        }
    }
}

if (-not $psqlPath) {
    Write-Host "   ERROR: Could not find PostgreSQL installation" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please ensure PostgreSQL is installed or add it to PATH" -ForegroundColor Yellow
    exit 1
}

# Get password if not provided
if ([string]::IsNullOrWhiteSpace($PostgresPassword)) {
    Write-Host ""
    Write-Host "[Step 2/6] Database connection..." -ForegroundColor Yellow
    $securePassword = Read-Host "   Enter PostgreSQL password for user '$PostgresUser'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
} else {
    Write-Host "[Step 2/6] Using provided password" -ForegroundColor Yellow
}

# Set environment variable for psql
$env:PGPASSWORD = $PostgresPassword

# Test connection
Write-Host ""
Write-Host "[Step 3/6] Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    $testResult = & $psqlPath -U $PostgresUser -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $version = $testResult | Select-String -Pattern "PostgreSQL (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }
        Write-Host "   SUCCESS: Connected to PostgreSQL $version" -ForegroundColor Green
    } else {
        throw "Connection failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "   ERROR: Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - PostgreSQL service not running" -ForegroundColor Gray
    Write-Host "   - Wrong password" -ForegroundColor Gray
    Write-Host "   - Wrong username (trying: $PostgresUser)" -ForegroundColor Gray
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Check if database exists
Write-Host ""
Write-Host "[Step 4/6] Checking if database '$DbName' exists..." -ForegroundColor Yellow
$dbList = & $psqlPath -U $PostgresUser -lqt 2>&1
$dbExists = $dbList | Select-String -Pattern "\b$DbName\b"

if ($dbExists) {
    Write-Host "   WARNING: Database '$DbName' already exists" -ForegroundColor Yellow
    $response = Read-Host "   Do you want to drop and recreate it? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "   Dropping existing database..." -ForegroundColor Yellow
        & $psqlPath -U $PostgresUser -c "DROP DATABASE IF EXISTS $DbName;" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   WARNING: Could not drop database" -ForegroundColor Yellow
        } else {
            Write-Host "   SUCCESS: Database dropped" -ForegroundColor Green
        }
    } else {
        Write-Host "   Using existing database" -ForegroundColor Green
    }
}

# Create database if needed
if (-not $dbExists -or ($response -eq 'y' -or $response -eq 'Y')) {
    Write-Host ""
    Write-Host "[Step 5/6] Creating database '$DbName'..." -ForegroundColor Yellow
    try {
        $createResult = & $psqlPath -U $PostgresUser -c "CREATE DATABASE $DbName;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   SUCCESS: Database '$DbName' created!" -ForegroundColor Green
        } else {
            if ($createResult -match "already exists") {
                Write-Host "   INFO: Database already exists (okay to continue)" -ForegroundColor Green
            } else {
                Write-Host "   ERROR: Failed to create database" -ForegroundColor Red
                Write-Host "   $createResult" -ForegroundColor Red
                Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
                exit 1
            }
        }
    } catch {
        Write-Host "   ERROR: $_" -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[Step 5/6] Skipping database creation (using existing)" -ForegroundColor Yellow
}

# Verify database
Write-Host ""
Write-Host "[Step 6/6] Verifying database setup..." -ForegroundColor Yellow
$verify = & $psqlPath -U $PostgresUser -lqt 2>&1 | Select-String -Pattern "\b$DbName\b"
if ($verify) {
    Write-Host "   SUCCESS: Database verified and ready!" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Could not verify database" -ForegroundColor Yellow
}

# Clean up
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Creating environment file..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "   Creating .env file..." -ForegroundColor Cyan
    
    # Generate JWT secret
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
    
    $envContent = @"
# Database
DATABASE_URL="postgresql://${PostgresUser}:${PostgresPassword}@localhost:5432/${DbName}?schema=public"

# JWT
JWT_SECRET="$jwtSecret"
JWT_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host "   SUCCESS: .env file created at $envPath" -ForegroundColor Green
} else {
    Write-Host "   INFO: .env file already exists (not overwriting)" -ForegroundColor Yellow
    Write-Host "   Please update DATABASE_URL in .env if needed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "   Database Setup Complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to complete setup:" -ForegroundColor Cyan
Write-Host "1. cd backend" -ForegroundColor White
Write-Host "2. npm install (if not done)" -ForegroundColor White
Write-Host "3. npx prisma generate" -ForegroundColor White
Write-Host "4. npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "5. npx prisma db seed" -ForegroundColor White
Write-Host ""
Write-Host "Or run the quick setup script:" -ForegroundColor Cyan
Write-Host "   .\scripts\quick-setup.ps1" -ForegroundColor White
Write-Host ""

