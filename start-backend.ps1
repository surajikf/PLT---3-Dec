# Quick script to start backend server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Write-Host ""

cd backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please copy env.example.txt to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Start server
Write-Host "✅ Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host ""
npm run dev

