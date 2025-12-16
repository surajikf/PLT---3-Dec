# Quick Supabase Setup Script
# Run this script to set up Supabase connection

param(
    [Parameter(Mandatory=$false)]
    [string]$Password = ""
)

Write-Host "🚀 Supabase Database Setup" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($Password)) {
    Write-Host "⚠️  Database password required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your password from:" -ForegroundColor White
    Write-Host "   https://supabase.com/dashboard/project/yxbvvjczmfsqnksgxgrj" -ForegroundColor Cyan
    Write-Host "   Settings → Database → Connection string → Show Password" -ForegroundColor White
    Write-Host ""
    $securePassword = Read-Host "Enter Supabase database password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# URL encode password (handle special characters)
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($Password)

# Connection string
$connectionString = "postgresql://postgres:$encodedPassword@db.yxbvvjczmfsqnksgxgrj.supabase.co:5432/postgres"

Write-Host ""
Write-Host "[1/4] Updating .env file..." -ForegroundColor Yellow

$envPath = ".\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "   Creating .env from template..." -ForegroundColor Yellow
    if (Test-Path ".\env.example.txt") {
        Copy-Item ".\env.example.txt" $envPath
    } else {
        @"
DATABASE_URL="$connectionString"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
"@ | Set-Content $envPath
    }
}

# Read and update .env
$lines = Get-Content $envPath
$updated = $false
$newLines = @()

foreach ($line in $lines) {
    if ($line -match '^DATABASE_URL=') {
        $newLines += "DATABASE_URL=`"$connectionString`""
        $updated = $true
    } else {
        $newLines += $line
    }
}

if (-not $updated) {
    $newLines = @("DATABASE_URL=`"$connectionString`"", "") + $newLines
}

$newLines | Set-Content $envPath

Write-Host "   ✅ DATABASE_URL updated in .env" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Generating Prisma Client..." -ForegroundColor Yellow
Write-Host "   (This may take a moment...)" -ForegroundColor Gray

$null = Start-Process -FilePath "npx" -ArgumentList "prisma","generate" -Wait -NoNewWindow -PassThru
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma generate had issues (try running manually)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next commands to run:" -ForegroundColor Cyan
Write-Host "   npx prisma migrate dev --name init_supabase" -ForegroundColor White
Write-Host "   npx prisma db seed  (optional)" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""




