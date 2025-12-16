# Start Both Backend and Frontend Servers
Write-Host "🚀 Starting IKF Project Livetracker..." -ForegroundColor Green
Write-Host ""

# Check if backend .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ Backend .env file not found!" -ForegroundColor Red
    Write-Host "   Please create backend\.env from backend\env.example.txt" -ForegroundColor Yellow
    Write-Host "   Configure your DATABASE_URL and other settings" -ForegroundColor Yellow
    exit 1
}

# Start Backend
Write-Host "📦 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🚀 Backend Server Starting...' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "   ⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is up
$maxRetries = 12
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        break
    } catch {
        $retryCount++
        Start-Sleep -Seconds 2
    }
}

if ($backendReady) {
    Write-Host "   ✅ Backend server is ready!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend may still be starting..." -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "📦 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🚀 Frontend Server Starting...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Wait a few seconds for both servers to fully start" -ForegroundColor Yellow
Write-Host "   Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Default Login:" -ForegroundColor Cyan
Write-Host "   Email: superadmin@ikf.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White





