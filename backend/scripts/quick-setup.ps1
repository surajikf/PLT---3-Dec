# Quick Database Setup Script (PowerShell)
# This script performs all database setup steps in sequence

$ErrorActionPreference = "Stop"

Write-Host "🚀 Quick Database Setup for IKF Project Livetracker" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📝 Please update backend/.env with your database credentials" -ForegroundColor Yellow
        Write-Host "❌ Setup stopped. Please configure .env and run again." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "❌ .env.example not found. Cannot create .env file." -ForegroundColor Red
        exit 1
    }
}

# Check if DATABASE_URL is set
$envContent = Get-Content ".env" -Raw
if (-not $envContent -match "DATABASE_URL\s*=" -or $envContent -match "DATABASE_URL\s*=\s*`"`"") {
    Write-Host "⚠️  DATABASE_URL not configured in .env" -ForegroundColor Yellow
    Write-Host "❌ Please set DATABASE_URL in backend/.env and run again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment configuration found" -ForegroundColor Green

# Step 1: Generate Prisma Client
Write-Host ""
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Green
try {
    npx prisma generate
    Write-Host "✅ Prisma Client generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Step 2: Run Migrations
Write-Host ""
Write-Host "Step 2: Running database migrations..." -ForegroundColor Green
try {
    npx prisma migrate dev --name init
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

# Step 3: Seed Database
Write-Host ""
Write-Host "Step 3: Seeding database..." -ForegroundColor Green
try {
    npx prisma db seed
    Write-Host "✅ Database seeded" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Seeding failed (this might be okay if data already exists)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Default login credentials:"
Write-Host "  Super Admin: superadmin@ikf.com / password123"
Write-Host "  Admin: admin@ikf.com / password123"
Write-Host "  Project Manager: pm@ikf.com / password123"
Write-Host ""
Write-Host "⚠️  Remember to change these passwords in production!" -ForegroundColor Yellow

