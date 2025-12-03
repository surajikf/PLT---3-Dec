# PostgreSQL Database Setup Script for IKF Project Livetracker (PowerShell)
# This script automates the database setup process on Windows

param(
    [string]$DbName = "plt_db",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "",
    [switch]$CreateAppUser = $false,
    [string]$AppUser = "plt_user",
    [string]$AppUserPassword = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up PostgreSQL database for IKF Project Livetracker..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
try {
    $psqlPath = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL client found at: $($psqlPath.Source)" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client (psql) is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install PostgreSQL and ensure psql is in your PATH." -ForegroundColor Yellow
    exit 1
}

# Check if database exists
$dbExists = psql -U $DbUser -lqt 2>$null | Select-String -Pattern "\b$DbName\b"

if ($dbExists) {
    Write-Host "⚠️  Database '$DbName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Do you want to drop and recreate it? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        $env:PGPASSWORD = $DbPassword
        psql -U $DbUser -c "DROP DATABASE IF EXISTS $DbName;" 2>&1 | Out-Null
        Remove-Item Env:\PGPASSWORD
    } else {
        Write-Host "✅ Using existing database '$DbName'" -ForegroundColor Green
        exit 0
    }
}

# Set PGPASSWORD if provided
if ($DbPassword) {
    $env:PGPASSWORD = $DbPassword
}

# Create database
Write-Host "Creating database '$DbName'..." -ForegroundColor Cyan
try {
    $createDbResult = psql -U $DbUser -c "CREATE DATABASE $DbName;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database"
    }
    Write-Host "✅ Database '$DbName' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create database." -ForegroundColor Red
    Write-Host "Please check your PostgreSQL connection settings." -ForegroundColor Yellow
    if ($env:PGPASSWORD) {
        Remove-Item Env:\PGPASSWORD
    }
    exit 1
}

# Create application user if requested
if ($CreateAppUser) {
    if (-not $AppUserPassword) {
        Write-Host "❌ Error: -AppUserPassword is required when using -CreateAppUser" -ForegroundColor Red
        if ($env:PGPASSWORD) {
            Remove-Item Env:\PGPASSWORD
        }
        exit 1
    }
    
    Write-Host "Creating application user '$AppUser'..." -ForegroundColor Cyan
    psql -U $DbUser -c "CREATE USER $AppUser WITH PASSWORD '$AppUserPassword';" 2>&1 | Out-Null
    psql -U $DbUser -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $AppUser;" 2>&1 | Out-Null
    psql -U $DbUser -d $DbName -c "GRANT ALL ON SCHEMA public TO $AppUser;" 2>&1 | Out-Null
    
    Write-Host "✅ Application user '$AppUser' created and granted privileges!" -ForegroundColor Green
    Write-Host "📝 Update your DATABASE_URL to use: postgresql://${AppUser}:${AppUserPassword}@localhost:5432/${DbName}" -ForegroundColor Yellow
}

# Clean up
if ($env:PGPASSWORD) {
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Update backend/.env with your DATABASE_URL"
Write-Host "2. Run: cd backend && npx prisma generate"
Write-Host "3. Run: cd backend && npx prisma migrate dev"
Write-Host "4. Run: cd backend && npx prisma db seed"

