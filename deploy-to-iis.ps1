# IIS Deployment Script for IKF Project Livetracker
# Run this script as Administrator on your Windows Server

param(
    [string]$ServerPath = "C:\inetpub\wwwroot",
    [string]$BackendPath = "",
    [string]$FrontendPath = "",
    [string]$ServerIP = "192.168.2.100",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   IIS Deployment Script for Project Livetracker" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Set paths
$BackendDeployPath = Join-Path $ServerPath "plt-api"
$FrontendDeployPath = Join-Path $ServerPath "plt"

if ([string]::IsNullOrWhiteSpace($BackendPath)) {
    $BackendPath = Join-Path $PSScriptRoot "backend"
}

if ([string]::IsNullOrWhiteSpace($FrontendPath)) {
    $FrontendPath = Join-Path $PSScriptRoot "frontend"
}

Write-Host "[Step 1/8] Checking prerequisites..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if IIS is installed
$iisFeature = Get-WindowsFeature -Name Web-Server
if (-not $iisFeature.Installed) {
    Write-Host "   ✗ IIS is not installed. Please install IIS first." -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ IIS is installed" -ForegroundColor Green

# Check if URL Rewrite module is installed
$urlRewrite = Get-WebGlobalModule | Where-Object { $_.Name -eq "RewriteModule" }
if (-not $urlRewrite) {
    Write-Host "   ⚠ URL Rewrite module not found. Please install it from:" -ForegroundColor Yellow
    Write-Host "   https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ URL Rewrite module found" -ForegroundColor Green
}

# Check if iisnode is installed
$iisnodePath = "C:\Program Files\iisnode"
if (-not (Test-Path $iisnodePath)) {
    Write-Host "   ⚠ iisnode not found. Please install it from:" -ForegroundColor Yellow
    Write-Host "   https://github.com/Azure/iisnode/releases" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ iisnode found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Step 2/8] Building backend..." -ForegroundColor Yellow

if (-not $SkipBuild) {
    Push-Location $BackendPath
    
    if (-not (Test-Path "package.json")) {
        Write-Host "   ✗ Backend package.json not found at: $BackendPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install --production
    
    Write-Host "   Building TypeScript..." -ForegroundColor Gray
    npm run build
    
    Write-Host "   Generating Prisma Client..." -ForegroundColor Gray
    npx prisma generate
    
    Pop-Location
    Write-Host "   ✓ Backend built successfully" -ForegroundColor Green
} else {
    Write-Host "   ⏭ Skipping build (using existing files)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[Step 3/8] Building frontend..." -ForegroundColor Yellow

if (-not $SkipBuild) {
    Push-Location $FrontendPath
    
    if (-not (Test-Path "package.json")) {
        Write-Host "   ✗ Frontend package.json not found at: $FrontendPath" -ForegroundColor Red
        exit 1
    }
    
    # Create .env.production if it doesn't exist
    $envProdPath = Join-Path $FrontendPath ".env.production"
    if (-not (Test-Path $envProdPath)) {
        Write-Host "   Creating .env.production..." -ForegroundColor Gray
        $apiUrl = "http://$ServerIP/plt-api/api"
        @"
VITE_API_URL=$apiUrl
"@ | Out-File -FilePath $envProdPath -Encoding utf8
        Write-Host "   ✓ Created .env.production with API URL: $apiUrl" -ForegroundColor Green
    }
    
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install
    
    Write-Host "   Building frontend..." -ForegroundColor Gray
    npm run build
    
    Pop-Location
    Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "   ⏭ Skipping build (using existing files)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[Step 4/8] Creating deployment directories..." -ForegroundColor Yellow

# Create backend directory
if (-not (Test-Path $BackendDeployPath)) {
    New-Item -ItemType Directory -Path $BackendDeployPath -Force | Out-Null
    Write-Host "   ✓ Created: $BackendDeployPath" -ForegroundColor Green
} else {
    Write-Host "   ✓ Directory exists: $BackendDeployPath" -ForegroundColor Green
}

# Create frontend directory
if (-not (Test-Path $FrontendDeployPath)) {
    New-Item -ItemType Directory -Path $FrontendDeployPath -Force | Out-Null
    Write-Host "   ✓ Created: $FrontendDeployPath" -ForegroundColor Green
} else {
    Write-Host "   ✓ Directory exists: $FrontendDeployPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Step 5/8] Copying backend files..." -ForegroundColor Yellow

# Copy backend files
$backendSource = $BackendPath
$backendDest = $BackendDeployPath

# Files to copy
$backendFiles = @(
    "dist",
    "node_modules",
    "prisma",
    "package.json",
    "package-lock.json",
    "web.config"
)

foreach ($item in $backendFiles) {
    $sourcePath = Join-Path $backendSource $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $backendDest $item
        if (Test-Path $destPath) {
            Remove-Item $destPath -Recurse -Force
        }
        Copy-Item $sourcePath $destPath -Recurse -Force
        Write-Host "   ✓ Copied: $item" -ForegroundColor Green
    }
}

# Copy .env if it exists, otherwise create from example
$envSource = Join-Path $backendSource ".env"
$envDest = Join-Path $backendDest ".env"
if (Test-Path $envSource) {
    Copy-Item $envSource $envDest -Force
    Write-Host "   ✓ Copied: .env" -ForegroundColor Green
} else {
    Write-Host "   ⚠ .env not found. Please create it manually in: $envDest" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Step 6/8] Copying frontend files..." -ForegroundColor Yellow

# Copy frontend dist files
$frontendDist = Join-Path $FrontendPath "dist"
if (Test-Path $frontendDist) {
    Get-ChildItem $frontendDist | Copy-Item -Destination $FrontendDeployPath -Recurse -Force
    Write-Host "   ✓ Copied frontend dist files" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend dist folder not found. Please build the frontend first." -ForegroundColor Red
    exit 1
}

# Copy web.config
$frontendWebConfig = Join-Path $FrontendPath "web.config"
if (Test-Path $frontendWebConfig) {
    Copy-Item $frontendWebConfig $FrontendDeployPath -Force
    Write-Host "   ✓ Copied: web.config" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Frontend web.config not found. Please create it." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Step 7/8] Setting file permissions..." -ForegroundColor Yellow

# Set permissions for IIS
try {
    icacls $BackendDeployPath /grant "IIS_IUSRS:(OI)(CI)F" /T /Q | Out-Null
    icacls $FrontendDeployPath /grant "IIS_IUSRS:(OI)(CI)F" /T /Q | Out-Null
    Write-Host "   ✓ Permissions set successfully" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not set permissions automatically. Please set manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Step 8/8] Configuring IIS applications..." -ForegroundColor Yellow

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Create backend application
$backendAppPool = "plt-api-pool"
$backendApp = "plt-api"

try {
    # Create application pool
    if (Get-WebAppPoolState -Name $backendAppPool -ErrorAction SilentlyContinue) {
        Write-Host "   ✓ Application pool exists: $backendAppPool" -ForegroundColor Green
    } else {
        New-WebAppPool -Name $backendAppPool | Out-Null
        Set-ItemProperty "IIS:\AppPools\$backendAppPool" -Name managedRuntimeVersion -Value ""
        Set-ItemProperty "IIS:\AppPools\$backendAppPool" -Name managedPipelineMode -Value "Integrated"
        Write-Host "   ✓ Created application pool: $backendAppPool" -ForegroundColor Green
    }
    
    # Create backend application
    if (Get-WebApplication -Site "Default Web Site" -Name $backendApp -ErrorAction SilentlyContinue) {
        Set-WebApplication -Site "Default Web Site" -Name $backendApp -PhysicalPath $BackendDeployPath -ApplicationPool $backendAppPool
        Write-Host "   ✓ Updated application: $backendApp" -ForegroundColor Green
    } else {
        New-WebApplication -Site "Default Web Site" -Name $backendApp -PhysicalPath $BackendDeployPath -ApplicationPool $backendAppPool
        Write-Host "   ✓ Created application: $backendApp" -ForegroundColor Green
    }
    
    # Create frontend application
    $frontendAppPool = "plt-pool"
    $frontendApp = "plt"
    
    if (Get-WebAppPoolState -Name $frontendAppPool -ErrorAction SilentlyContinue) {
        Write-Host "   ✓ Application pool exists: $frontendAppPool" -ForegroundColor Green
    } else {
        New-WebAppPool -Name $frontendAppPool | Out-Null
        Set-ItemProperty "IIS:\AppPools\$frontendAppPool" -Name managedRuntimeVersion -Value ""
        Set-ItemProperty "IIS:\AppPools\$frontendAppPool" -Name managedPipelineMode -Value "Integrated"
        Write-Host "   ✓ Created application pool: $frontendAppPool" -ForegroundColor Green
    }
    
    if (Get-WebApplication -Site "Default Web Site" -Name $frontendApp -ErrorAction SilentlyContinue) {
        Set-WebApplication -Site "Default Web Site" -Name $frontendApp -PhysicalPath $FrontendDeployPath -ApplicationPool $frontendAppPool
        Write-Host "   ✓ Updated application: $frontendApp" -ForegroundColor Green
    } else {
        New-WebApplication -Site "Default Web Site" -Name $frontendApp -PhysicalPath $FrontendDeployPath -ApplicationPool $frontendAppPool
        Write-Host "   ✓ Created application: $frontendApp" -ForegroundColor Green
    }
    
    # Start application pools
    Start-WebAppPool -Name $backendAppPool
    Start-WebAppPool -Name $frontendAppPool
    
    Write-Host "   ✓ Application pools started" -ForegroundColor Green
    
} catch {
    Write-Host "   ⚠ Could not configure IIS automatically. Please configure manually:" -ForegroundColor Yellow
    Write-Host "     1. Create application pools: $backendAppPool, $frontendAppPool" -ForegroundColor Gray
    Write-Host "     2. Create applications: $backendApp, $frontendApp" -ForegroundColor Gray
    Write-Host "     3. Set .NET CLR Version to 'No Managed Code'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify .env file exists at: $BackendDeployPath\.env" -ForegroundColor White
Write-Host "2. Update CORS_ORIGIN in .env with your server IP/domain" -ForegroundColor White
Write-Host "3. Test backend: http://$ServerIP/plt-api/health" -ForegroundColor White
Write-Host "4. Test frontend: http://$ServerIP/plt" -ForegroundColor White
Write-Host ""
Write-Host "If you encounter issues:" -ForegroundColor Yellow
Write-Host "- Check IIS logs: C:\inetpub\logs\LogFiles\" -ForegroundColor White
Write-Host "- Check iisnode logs: $BackendDeployPath\logs\" -ForegroundColor White
Write-Host "- Review IIS_DEPLOYMENT_GUIDE.md for troubleshooting" -ForegroundColor White
Write-Host ""

