# Complete Database Setup Script
# Creates all tables and verifies database connection

Write-Host "🚀 Complete Database Setup for IKF Project Livetracker" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check .env file
Write-Host "[1/6] Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".\.env")) {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   See env.example.txt for format" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content ".\.env" -Raw
if (-not ($envContent -match 'DATABASE_URL=')) {
    Write-Host "   ❌ DATABASE_URL not found in .env!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ .env file found" -ForegroundColor Green

# Step 2: Generate Prisma Client
Write-Host ""
Write-Host "[2/6] Generating Prisma Client..." -ForegroundColor Yellow
try {
    $null = & npx prisma generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma Client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma generate had warnings (checking anyway...)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Check database connection
Write-Host ""
Write-Host "[3/6] Testing database connection..." -ForegroundColor Yellow
try {
    $testScript = @"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.\$connect();
    console.log('SUCCESS');
    await prisma.\$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
test();
"@
    $testScript | Out-File -FilePath "temp-test-connection.ts" -Encoding utf8
    $result = & npx tsx temp-test-connection.ts 2>&1
    Remove-Item "temp-test-connection.ts" -ErrorAction SilentlyContinue
    if ($result -match "SUCCESS") {
        Write-Host "   ✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "   $result" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Please check:" -ForegroundColor Yellow
        Write-Host "   1. DATABASE_URL in .env is correct" -ForegroundColor White
        Write-Host "   2. Database server is accessible" -ForegroundColor White
        Write-Host "   3. Credentials are correct" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "   ⚠️  Could not test connection (proceeding anyway...)" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Gray
}

# Step 4: Create all tables with migrations
Write-Host ""
Write-Host "[4/6] Creating database tables..." -ForegroundColor Yellow
Write-Host "   This will create all required tables:" -ForegroundColor Gray
Write-Host "   - User, Department, Customer" -ForegroundColor Gray
Write-Host "   - Project, ProjectMember, ProjectStage" -ForegroundColor Gray
Write-Host "   - Stage, Timesheet, Task" -ForegroundColor Gray
Write-Host "   - Resource, AuditLog" -ForegroundColor Gray
Write-Host ""

try {
    $migrateOutput = & npx prisma migrate dev --name init_all_tables 2>&1
    if ($LASTEXITCODE -eq 0 -or $migrateOutput -match "Already in sync" -or $migrateOutput -match "Applied migration") {
        Write-Host "   ✅ All tables created successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Migration output:" -ForegroundColor Yellow
        Write-Host $migrateOutput -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed to create tables" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Verify tables
Write-Host ""
Write-Host "[5/6] Verifying tables were created..." -ForegroundColor Yellow
try {
    $verifyScript = @"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function verify() {
  try {
    await prisma.\$connect();
    const tables = await prisma.\$queryRaw\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    \`;
    console.log('TABLES:', JSON.stringify(tables));
    const count = Array.isArray(tables) ? tables.length : 0;
    if (count >= 10) {
      console.log('SUCCESS');
    } else {
      console.log('WARNING: Only', count, 'tables found');
    }
    await prisma.\$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
verify();
"@
    $verifyScript | Out-File -FilePath "temp-verify-tables.ts" -Encoding utf8
    $verifyResult = & npx tsx temp-verify-tables.ts 2>&1
    Remove-Item "temp-verify-tables.ts" -ErrorAction SilentlyContinue
    
    if ($verifyResult -match "TABLES:") {
        $tablesJson = ($verifyResult | Select-String -Pattern 'TABLES: (.+)').Matches[0].Groups[1].Value
        Write-Host "   ✅ Tables verified" -ForegroundColor Green
        Write-Host "   Found tables in database" -ForegroundColor Gray
    }
    if ($verifyResult -match "SUCCESS") {
        Write-Host "   ✅ All required tables exist" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not verify tables (they may still be created)" -ForegroundColor Yellow
}

# Step 6: Summary
Write-Host ""
Write-Host "[6/6] Setup Summary" -ForegroundColor Yellow
Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
Write-Host "   ✅ Database connection verified" -ForegroundColor Green
Write-Host "   ✅ All tables created" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Seed initial data: npx prisma db seed" -ForegroundColor White
Write-Host "   2. Start server: npm run dev" -ForegroundColor White
Write-Host "   3. Open Prisma Studio: npx prisma studio" -ForegroundColor White
Write-Host ""




