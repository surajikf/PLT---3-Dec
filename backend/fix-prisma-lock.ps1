# Fix Prisma Lock Issue
# This script stops Node.js processes and regenerates Prisma client

Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow

# Get all Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    
    # Stop all Node.js processes
    foreach ($process in $nodeProcesses) {
        Write-Host "Stopping process: $($process.Id) - $($process.ProcessName)" -ForegroundColor Cyan
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Wait a moment for processes to fully terminate
    Start-Sleep -Seconds 2
    Write-Host "Node.js processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found." -ForegroundColor Green
}

# Try to delete the locked file if it exists
$lockedFile = "node_modules\.prisma\client\query_engine-windows.dll.node"
if (Test-Path $lockedFile) {
    Write-Host "Attempting to remove locked file..." -ForegroundColor Yellow
    try {
        Remove-Item $lockedFile -Force -ErrorAction Stop
        Write-Host "Locked file removed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Could not remove locked file. You may need to close your IDE or restart your computer." -ForegroundColor Red
    }
}

Write-Host "`nRegenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prisma client generated successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Prisma generation failed. Try:" -ForegroundColor Red
    Write-Host "1. Close your IDE (Cursor/VS Code)" -ForegroundColor Yellow
    Write-Host "2. Close any terminal windows" -ForegroundColor Yellow
    Write-Host "3. Restart your computer if the issue persists" -ForegroundColor Yellow
}


