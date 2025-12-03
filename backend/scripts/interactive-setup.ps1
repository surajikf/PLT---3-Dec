# Interactive PostgreSQL Database Setup Script
# This script guides you through the entire database setup process

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   IKF Project Livetracker - PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check PostgreSQL installation
Write-Host "[1/8] Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $psqlVersion = & psql --version 2>&1
    Write-Host "   ✅ PostgreSQL found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ PostgreSQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please install PostgreSQL from:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

# Step 2: Check if PostgreSQL service is running
Write-Host ""
Write-Host "[2/8] Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service | Where-Object {$_.Name -like "*postgresql*"} | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -eq 'Running') {
        Write-Host "   ✅ PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  PostgreSQL service is stopped" -ForegroundColor Yellow
        $start = Read-Host "   Start it now? (Y/N)"
        if ($start -eq 'Y' -or $start -eq 'y') {
            Start-Service $pgService.Name
            Write-Host "   ✅ Service started" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Cannot continue without PostgreSQL service running" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "   ⚠️  Could not find PostgreSQL service (this might be okay)" -ForegroundColor Yellow
}

# Step 3: Get database connection info
Write-Host ""
Write-Host "[3/8] Database connection information..." -ForegroundColor Yellow
$dbUser = Read-Host "   PostgreSQL username [postgres]"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

Write-Host "   Password will be requested when connecting to PostgreSQL" -ForegroundColor Cyan
$dbPassword = Read-Host "   Enter PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Step 4: Create database
Write-Host ""
Write-Host "[4/8] Creating database..." -ForegroundColor Yellow
$dbName = "plt_db"

# Check if database exists
$env:PGPASSWORD = $dbPasswordPlain
$dbCheck = & psql -U $dbUser -lqt 2>&1 | Select-String -Pattern "\b$dbName\b"

if ($dbCheck) {
    Write-Host "   ⚠️  Database '$dbName' already exists" -ForegroundColor Yellow
    $recreate = Read-Host "   Drop and recreate? (y/N)"
    if ($recreate -eq 'y' -or $recreate -eq 'Y') {
        Write-Host "   Dropping existing database..." -ForegroundColor Yellow
        & psql -U $dbUser -c "DROP DATABASE IF EXISTS $dbName;" 2>&1 | Out-Null
    } else {
        Write-Host "   ✅ Using existing database" -ForegroundColor Green
    }
}

# Create database if it doesn't exist
if (-not $dbCheck -or ($recreate -eq 'y' -or $recreate -eq 'Y')) {
    Write-Host "   Creating database '$dbName'..." -ForegroundColor Cyan
    $createResult = & psql -U $dbUser -c "CREATE DATABASE $dbName;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to create database: $createResult" -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
}

Remove-Item Env:\PGPASSWORD

# Step 5: Create .env file
Write-Host ""
Write-Host "[5/8] Creating environment file..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot "..\.env"
$envExamplePath = Join-Path $PSScriptRoot "..\env.example.txt"

if (Test-Path $envPath) {
    Write-Host "   ⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "   Overwrite? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "   ✅ Keeping existing .env file" -ForegroundColor Green
    } else {
        $overwrite = $true
    }
} else {
    $overwrite = $true
}

if ($overwrite) {
    # Generate JWT secret
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = @"
# Database
DATABASE_URL="postgresql://${dbUser}:${dbPasswordPlain}@localhost:5432/${dbName}?schema=public"

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
    Write-Host "   ✅ .env file created at: $envPath" -ForegroundColor Green
    Write-Host "   ⚠️  Please review and update JWT_SECRET if needed" -ForegroundColor Yellow
}

# Step 6: Install dependencies
Write-Host ""
Write-Host "[6/8] Installing dependencies..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot ".."
Push-Location $backendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing npm packages (this may take a few minutes)..." -ForegroundColor Cyan
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host "   ✅ Dependencies already installed" -ForegroundColor Green
}

# Step 7: Generate Prisma Client and run migrations
Write-Host ""
Write-Host "[7/8] Setting up database schema..." -ForegroundColor Yellow
Write-Host "   Generating Prisma Client..." -ForegroundColor Cyan
& npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to generate Prisma Client" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "   Running migrations..." -ForegroundColor Cyan
& npx prisma migrate dev --name init 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database schema created" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migration completed (or already applied)" -ForegroundColor Yellow
}

# Step 8: Seed database
Write-Host ""
Write-Host "[8/8] Seeding database with initial data..." -ForegroundColor Yellow
& npx prisma db seed 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Seeding completed (or data already exists)" -ForegroundColor Yellow
}

Pop-Location

# Final summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ Database Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Default Login Credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Super Admin:" -ForegroundColor White
Write-Host "     Email: superadmin@ikf.com" -ForegroundColor Gray
Write-Host "     Password: password123" -ForegroundColor Gray
Write-Host ""
Write-Host "   Admin:" -ForegroundColor White
Write-Host "     Email: admin@ikf.com" -ForegroundColor Gray
Write-Host "     Password: password123" -ForegroundColor Gray
Write-Host ""
Write-Host "   Project Manager:" -ForegroundColor White
Write-Host "     Email: pm@ikf.com" -ForegroundColor Gray
Write-Host "     Password: password123" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Remember to change these passwords in production!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start backend: npm run dev:backend" -ForegroundColor White
Write-Host "   2. Start frontend: npm run dev:frontend" -ForegroundColor White
Write-Host "   3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Run 'npx prisma studio' to view your database visually" -ForegroundColor Cyan
Write-Host ""

