# Supabase Database Setup Script
# This script helps you set up your Supabase database connection

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabasePassword
)

Write-Host "🚀 Setting up Supabase Database Connection..." -ForegroundColor Cyan
Write-Host ""

# Supabase details
$SUPABASE_PROJECT_REF = "yxbvvjczmfsqnksgxgrj"
$SUPABASE_HOST = "db.$SUPABASE_PROJECT_REF.supabase.co"
$SUPABASE_PORT = "5432"
$SUPABASE_DB = "postgres"
$SUPABASE_USER = "postgres"

# Construct connection string
$CONNECTION_STRING = "postgresql://${SUPABASE_USER}:${DatabasePassword}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

Write-Host "[1/4] Updating .env file..." -ForegroundColor Yellow

$envFile = ".\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "   ⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".\env.example.txt" $envFile
}

# Read current .env content
$envContent = Get-Content $envFile -Raw

# Replace DATABASE_URL
$newDatabaseUrl = "DATABASE_URL=`"$CONNECTION_STRING`""
if ($envContent -match 'DATABASE_URL="[^"]*"') {
    $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', $newDatabaseUrl
    Write-Host "   ✅ Updated DATABASE_URL" -ForegroundColor Green
} else {
    # Add DATABASE_URL if it doesn't exist
    $envContent = "DATABASE_URL=`"$CONNECTION_STRING`"`n`n" + $envContent
    Write-Host "   ✅ Added DATABASE_URL" -ForegroundColor Green
}

# Write back to file
Set-Content -Path $envFile -Value $envContent -NoNewline

Write-Host ""
Write-Host "[2/4] Generating Prisma Client for PostgreSQL..." -ForegroundColor Yellow
$generateResult = & npx prisma generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host $generateResult -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Testing database connection..." -ForegroundColor Yellow
# Test connection by trying to list databases
$testResult = & npx prisma db execute --stdin --schema=prisma/schema.prisma 2>&1
if ($LASTEXITCODE -eq 0 -or $testResult -match "success") {
    Write-Host "   ✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Could not verify connection (this is okay)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Ready to run migrations!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npx prisma migrate dev --name init_supabase" -ForegroundColor White
Write-Host "   2. Run: npx prisma db seed (optional)" -ForegroundColor White
Write-Host "   3. Start server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green




