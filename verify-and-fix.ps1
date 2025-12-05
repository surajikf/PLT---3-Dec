# Comprehensive Project Verification and Fix Script
Write-Host "🔍 Verifying Project Setup..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check Backend
Write-Host "📦 Checking Backend..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   ✅ Backend folder exists" -ForegroundColor Green
    
    # Check node_modules
    if (Test-Path "backend\node_modules") {
        Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        $warnings += "Backend node_modules missing - run 'cd backend && npm install'"
        Write-Host "   ⚠️  Backend dependencies NOT installed" -ForegroundColor Yellow
    }
    
    # Check .env
    if (Test-Path "backend\.env") {
        Write-Host "   ✅ Backend .env file exists" -ForegroundColor Green
    } else {
        $errors += "Backend .env file missing - copy env.example.txt to .env"
        Write-Host "   ❌ Backend .env file missing" -ForegroundColor Red
        if (Test-Path "backend\env.example.txt") {
            Write-Host "   💡 Copy env.example.txt to .env and configure it" -ForegroundColor Cyan
        }
    }
    
    # Check database connection
    Write-Host "   🔍 Testing database connection..." -ForegroundColor Yellow
    Push-Location backend
    try {
        $dbCheck = npm run check-db 2>&1 | Out-String
        Pop-Location
        if ($dbCheck -match "✅ Database connection successful") {
            Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        } else {
            $warnings += "Database connection failed - check DATABASE_URL in .env"
            Write-Host "   ⚠️  Database connection issue" -ForegroundColor Yellow
        }
    } catch {
        Pop-Location
        $warnings += "Could not test database - make sure backend dependencies are installed"
        Write-Host "   ⚠️  Could not test database connection" -ForegroundColor Yellow
    }
} else {
    $errors += "Backend folder not found"
    Write-Host "   ❌ Backend folder missing" -ForegroundColor Red
}

Write-Host ""

# Check Frontend
Write-Host "📦 Checking Frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Write-Host "   ✅ Frontend folder exists" -ForegroundColor Green
    
    # Check node_modules
    if (Test-Path "frontend\node_modules") {
        Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        $warnings += "Frontend node_modules missing - run 'cd frontend && npm install'"
        Write-Host "   ⚠️  Frontend dependencies NOT installed" -ForegroundColor Yellow
    }
} else {
    $errors += "Frontend folder not found"
    Write-Host "   ❌ Frontend folder missing" -ForegroundColor Red
}

Write-Host ""

# Check Backend Server Status
Write-Host "🖥️  Checking Backend Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Backend server is RUNNING" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend server is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it with: cd backend && npm run dev" -ForegroundColor Cyan
}

Write-Host ""

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ Everything looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 To start the project:" -ForegroundColor Green
    Write-Host "   1. Terminal 1: cd backend && npm run dev" -ForegroundColor White
    Write-Host "   2. Terminal 2: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "   3. Open: http://localhost:5173" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ Critical Issues Found:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "   - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "💡 Fix the issues above, then run this script again" -ForegroundColor Cyan
}

