# Simple Database Creation Script
# This script connects to PostgreSQL and creates the database

param(
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [string]$DbName = "plt_db"
)

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   Creating PostgreSQL Database: $DbName" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Get password if not provided
if ([string]::IsNullOrWhiteSpace($PostgresPassword)) {
    $securePassword = Read-Host "Enter PostgreSQL password for user '$PostgresUser'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Set environment variable for psql
$env:PGPASSWORD = $PostgresPassword

# Test connection first
Write-Host "[1/3] Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    $testResult = & psql -U $PostgresUser -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Connected to PostgreSQL successfully" -ForegroundColor Green
        $version = $testResult | Select-String -Pattern "PostgreSQL"
        if ($version) {
            Write-Host "   INFO: $version" -ForegroundColor Gray
        }
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "   ERROR: Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - PostgreSQL service not running" -ForegroundColor Gray
    Write-Host "   - Wrong password" -ForegroundColor Gray
    Write-Host "   - PostgreSQL not in PATH" -ForegroundColor Gray
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Check if database exists
Write-Host ""
Write-Host "[2/3] Checking if database '$DbName' exists..." -ForegroundColor Yellow
$dbExists = & psql -U $PostgresUser -lqt 2>&1 | Select-String -Pattern "\b$DbName\b"

if ($dbExists) {
    Write-Host "   WARNING: Database '$DbName' already exists" -ForegroundColor Yellow
    $response = Read-Host "   Do you want to drop and recreate it? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "   Dropping existing database..." -ForegroundColor Yellow
        & psql -U $PostgresUser -c "DROP DATABASE IF EXISTS $DbName;" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   WARNING: Could not drop database (might have active connections)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   SUCCESS: Using existing database '$DbName'" -ForegroundColor Green
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        exit 0
    }
}

# Create database
Write-Host ""
Write-Host "[3/3] Creating database '$DbName'..." -ForegroundColor Yellow
try {
    $createResult = & psql -U $PostgresUser -c "CREATE DATABASE $DbName;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Database '$DbName' created successfully!" -ForegroundColor Green
    } else {
        if ($createResult -match "already exists") {
            Write-Host "   SUCCESS: Database already exists (this is fine)" -ForegroundColor Green
        } else {
            Write-Host "   ERROR: Failed to create database" -ForegroundColor Red
            Write-Host "   Error: $createResult" -ForegroundColor Red
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
            exit 1
        }
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Verify database was created
Write-Host ""
Write-Host "Verifying database..." -ForegroundColor Yellow
$verify = & psql -U $PostgresUser -lqt 2>&1 | Select-String -Pattern "\b$DbName\b"
if ($verify) {
    Write-Host "   SUCCESS: Database verified and ready to use!" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Database created but verification failed" -ForegroundColor Yellow
}

# Clean up
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "   Database Setup Complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with DATABASE_URL" -ForegroundColor White
Write-Host "2. Run: cd backend" -ForegroundColor White
Write-Host "3. Run: npx prisma generate" -ForegroundColor White
Write-Host "4. Run: npx prisma migrate dev" -ForegroundColor White
Write-Host "5. Run: npx prisma db seed" -ForegroundColor White
Write-Host ""
