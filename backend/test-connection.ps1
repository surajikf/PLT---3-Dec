# Quick Supabase Connection Test

Write-Host "Testing Supabase Connection..." -ForegroundColor Cyan
Write-Host ""

# Load .env
$envContent = Get-Content ".\.env" -Raw
if ($envContent -match 'DATABASE_URL="([^"]+)"') {
    $dbUrl = $matches[1]
    Write-Host "Found DATABASE_URL" -ForegroundColor Green
    
    # Extract host
    if ($dbUrl -match '@([^:]+):(\d+)') {
        $dbHost = $matches[1]
        $dbPort = $matches[2]
        
        Write-Host "Host: $dbHost" -ForegroundColor White
        Write-Host "Port: $dbPort" -ForegroundColor White
        
        # Check if password is missing
        if ($dbUrl -match 'postgres://postgres:@' -or $dbUrl -match 'postgresql://postgres:@') {
            Write-Host ""
            Write-Host "❌ PASSWORD IS MISSING in DATABASE_URL!" -ForegroundColor Red
            Write-Host "The connection string shows: postgres:@ (no password)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Please update .env with:" -ForegroundColor Yellow
            Write-Host 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.yxbvvjczmfsqnksgxgrj.supabase.co:5432/postgres"' -ForegroundColor White
            exit 1
        }
        
        Write-Host ""
        Write-Host "Testing network connectivity..." -ForegroundColor Yellow
        try {
            $test = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            if ($test.TcpTestSucceeded) {
                Write-Host "✅ Network connection successful!" -ForegroundColor Green
            } else {
                Write-Host "❌ Cannot reach $host`:$port" -ForegroundColor Red
                Write-Host ""
                Write-Host "Possible issues:" -ForegroundColor Yellow
                Write-Host "  1. Supabase project might be paused" -ForegroundColor White
                Write-Host "  2. Firewall blocking connection" -ForegroundColor White
                Write-Host "  3. Wrong host/port" -ForegroundColor White
                Write-Host ""
                Write-Host "Check Supabase dashboard:" -ForegroundColor Cyan
                Write-Host "  https://supabase.com/dashboard/project/yxbvvjczmfsqnksgxgrj" -ForegroundColor White
            }
        } catch {
            Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
}

