# Comprehensive Database Connection Fix and Test

Write-Host "Supabase Connection Fix and Test" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current .env
Write-Host "[1/4] Checking current DATABASE_URL..." -ForegroundColor Yellow

if (-not (Test-Path ".\.env")) {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".\.env" -Raw
$dbUrlMatch = $envContent -match 'DATABASE_URL="([^"]+)"'

if (-not $dbUrlMatch) {
    Write-Host "   ❌ DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

$currentDbUrl = $matches[1]
Write-Host "   Current: $($currentDbUrl.Substring(0, [Math]::Min(60, $currentDbUrl.Length)))..." -ForegroundColor Gray

# Check if password is missing
if ($currentDbUrl -match 'postgres://postgres:@' -or $currentDbUrl -match 'postgresql://postgres:@') {
    Write-Host ""
    Write-Host "   ❌ PASSWORD IS MISSING!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Current (WRONG):" -ForegroundColor Yellow
    Write-Host "   postgresql://postgres:@db..." -ForegroundColor Red
    Write-Host ""
    Write-Host "   Need (CORRECT):" -ForegroundColor Yellow
    Write-Host "   postgresql://postgres:YOUR_PASSWORD@db..." -ForegroundColor Green
    Write-Host ""
    
    # Ask for password
    Write-Host "📝 Enter your Supabase database password:" -ForegroundColor Cyan
    Write-Host "   (Get it from: https://supabase.com/dashboard/project/yxbvvjczmfsqnksgxgrj)" -ForegroundColor Gray
    Write-Host "   Settings → Database → Connection string → Show Password" -ForegroundColor Gray
    Write-Host ""
    
    $securePassword = Read-Host "Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    if ([string]::IsNullOrWhiteSpace($password)) {
        Write-Host "   ❌ Password cannot be empty!" -ForegroundColor Red
        exit 1
    }
    
    # URL encode password (handle special characters)
    $encodedPassword = [System.Uri]::EscapeDataString($password)
    
    # Construct new connection string
    $newDbUrl = "postgresql://postgres:$encodedPassword@db.yxbvvjczmfsqnksgxgrj.supabase.co:5432/postgres"
    
    # Update .env
    Write-Host ""
    Write-Host "[2/4] Updating .env file..." -ForegroundColor Yellow
    
    $newEnvContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$newDbUrl`""
    Set-Content -Path ".\.env" -Value $newEnvContent -NoNewline
    
    Write-Host "   ✅ DATABASE_URL updated with password" -ForegroundColor Green
    
    $dbUrlToTest = $newDbUrl
} else {
    Write-Host "   ✅ Password appears to be present" -ForegroundColor Green
    $dbUrlToTest = $currentDbUrl
}

# Step 3: Test network connectivity
Write-Host ""
Write-Host "[3/4] Testing network connectivity..." -ForegroundColor Yellow

if ($dbUrlToTest -match '@([^:]+):(\d+)') {
    $dbHost = $matches[1]
    $dbPort = [int]$matches[2]
    
    Write-Host "   Testing: $dbHost`:$dbPort" -ForegroundColor Gray
    
    try {
        $test = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue -ErrorAction Stop
        if ($test.TcpTestSucceeded) {
            Write-Host "   ✅ Network connection successful!" -ForegroundColor Green
            $networkOk = $true
        } else {
            Write-Host "   ERROR: Cannot reach $dbHost`:$dbPort" -ForegroundColor Red
            $networkOk = $false
        }
    } catch {
        Write-Host "   ⚠️  Network test failed (may still work): $_" -ForegroundColor Yellow
        $networkOk = $null
    }
} else {
    Write-Host "   ⚠️  Could not extract host/port from connection string" -ForegroundColor Yellow
    $networkOk = $null
}

# Step 4: Test Prisma connection
Write-Host ""
Write-Host "[4/4] Testing Prisma database connection..." -ForegroundColor Yellow

$testScript = @"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.\$connect();
    console.log('PRISMA_OK');
    await prisma.\$disconnect();
  } catch (e) {
    console.log('PRISMA_ERROR:', e.message);
    process.exit(1);
  }
}
test();
"@

try {
    $testScript | Out-File -FilePath ".\temp-prisma-test.ts" -Encoding utf8 -ErrorAction SilentlyContinue
    $result = & npx tsx .\temp-prisma-test.ts 2>&1 | Out-String
    Remove-Item ".\temp-prisma-test.ts" -ErrorAction SilentlyContinue
    
    if ($result -match "PRISMA_OK") {
        Write-Host "   ✅ Prisma connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Database connection is working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   npx prisma db push --accept-data-loss" -ForegroundColor White
        Write-Host "   npx prisma db seed" -ForegroundColor White
        Write-Host "   npm run dev" -ForegroundColor White
        exit 0
    } elseif ($result -match "PRISMA_ERROR:") {
        $errorMsg = ($result | Select-String -Pattern 'PRISMA_ERROR: (.+)').Matches[0].Groups[1].Value
        Write-Host "   ❌ Prisma connection failed" -ForegroundColor Red
        Write-Host "   Error: $errorMsg" -ForegroundColor Red
        Write-Host ""
        
        if ($errorMsg -match "Can't reach database server") {
            Write-Host "Possible issues:" -ForegroundColor Yellow
            Write-Host "   1. Supabase project might be PAUSED" -ForegroundColor White
            Write-Host "      → Check: https://supabase.com/dashboard/project/yxbvvjczmfsqnksgxgrj" -ForegroundColor Gray
            Write-Host "      → Click 'Restore' or 'Resume' if paused" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   2. Firewall blocking port 5432" -ForegroundColor White
            Write-Host "      → Try from different network" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   3. Wrong host or connection string" -ForegroundColor White
            Write-Host "      → Verify connection string in Supabase dashboard" -ForegroundColor Gray
        } elseif ($errorMsg -match "password authentication failed" -or $errorMsg -match "authentication failed") {
            Write-Host "   Password might be incorrect" -ForegroundColor Yellow
            Write-Host "   → Double-check password in Supabase dashboard" -ForegroundColor Gray
            Write-Host "   → Or reset database password" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Unexpected result: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Test failed: $_" -ForegroundColor Red
}

Write-Host ""

