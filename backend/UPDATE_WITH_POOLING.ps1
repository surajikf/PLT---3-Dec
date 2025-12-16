# Update DATABASE_URL with Connection Pooling

Write-Host "Updating to Connection Pooling URL..." -ForegroundColor Cyan
Write-Host ""

# Get region from user
Write-Host "Please provide your Supabase region:" -ForegroundColor Yellow
Write-Host "Common regions: us-east-1, us-west-1, eu-west-1, ap-southeast-1, etc." -ForegroundColor Gray
$region = Read-Host "Region (e.g., us-east-1)"

if ([string]::IsNullOrWhiteSpace($region)) {
    Write-Host "Using default region us-east-1" -ForegroundColor Yellow
    $region = "us-east-1"
}

# Password
$password = "Suraj@08051992"
$encodedPassword = [System.Uri]::EscapeDataString($password)

# Connection pooling URL
$poolingUrl = "postgresql://postgres.yxbvvjczmfsqnksgxgrj:$encodedPassword@aws-0-$region.pooler.supabase.com:6543/postgres?pgbouncer=true"

Write-Host ""
Write-Host "New connection string:" -ForegroundColor Yellow
Write-Host "postgresql://postgres.yxbvvjczmfsqnksgxgrj:****@aws-0-$region.pooler.supabase.com:6543/postgres?pgbouncer=true" -ForegroundColor Gray
Write-Host ""

# Update .env
$envContent = Get-Content ".\.env" -Raw
$newEnvContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$poolingUrl`""
Set-Content -Path ".\.env" -Value $newEnvContent -NoNewline

Write-Host "✅ DATABASE_URL updated with connection pooling!" -ForegroundColor Green
Write-Host ""
Write-Host "Now test the connection:" -ForegroundColor Cyan
Write-Host "  npx prisma db push --accept-data-loss" -ForegroundColor White
Write-Host ""




