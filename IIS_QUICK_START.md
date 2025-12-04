# IIS Deployment - Quick Start Guide

This is a condensed version of the full deployment guide. For detailed instructions, see `IIS_DEPLOYMENT_GUIDE.md`.

## 🚀 Quick Deployment Steps

### Prerequisites Check
- [ ] Windows Server with IIS installed
- [ ] Node.js 18+ installed
- [ ] IIS URL Rewrite module installed
- [ ] IIS Application Request Routing (ARR) installed
- [ ] iisnode installed

### Step 1: Install IIS Modules (if not already installed)

1. **URL Rewrite:** https://www.iis.net/downloads/microsoft/url-rewrite
2. **ARR:** https://www.iis.net/downloads/microsoft/application-request-routing
3. **iisnode:** https://github.com/Azure/iisnode/releases

### Step 2: Build Applications

On your development machine or server:

```powershell
# Build Backend
cd backend
npm install
npm run build
npx prisma generate

# Build Frontend
cd ../frontend
# Create .env.production first (see IIS_ENV_SETUP.md)
npm install
npm run build
```

### Step 3: Deploy Using Script (Recommended)

```powershell
# Run as Administrator
.\deploy-to-iis.ps1 -ServerIP "192.168.2.100"
```

### Step 4: Manual Deployment (Alternative)

1. **Copy Backend:**
   - Copy `backend\*` to `C:\inetpub\wwwroot\plt-api\`
   - Copy `backend\web.config` to the same location

2. **Copy Frontend:**
   - Copy `frontend\dist\*` to `C:\inetpub\wwwroot\plt\`
   - Copy `frontend\web.config` to the same location

3. **Create Backend .env:**
   - Create `C:\inetpub\wwwroot\plt-api\.env`
   - See `IIS_ENV_SETUP.md` for content

4. **Configure IIS:**
   - Create application pools: `plt-api-pool`, `plt-pool`
   - Set .NET CLR Version: "No Managed Code"
   - Create applications: `plt-api`, `plt`
   - Point to respective folders

### Step 5: Set Permissions

```powershell
# Run as Administrator
icacls "C:\inetpub\wwwroot\plt-api" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\plt" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Step 6: Test

- Backend: http://192.168.2.100/plt-api/health
- Frontend: http://192.168.2.100/plt

## 📝 Important Files

- `IIS_DEPLOYMENT_GUIDE.md` - Complete detailed guide
- `IIS_ENV_SETUP.md` - Environment variables setup
- `deploy-to-iis.ps1` - Automated deployment script
- `backend/web.config` - Backend IIS configuration
- `frontend/web.config` - Frontend IIS configuration

## 🔧 Common Issues

### Backend Not Starting
- Check `C:\inetpub\wwwroot\plt-api\logs\` for errors
- Verify `.env` file exists and is correct
- Check application pool is running

### Frontend Not Loading
- Verify `web.config` is in frontend folder
- Check browser console for errors
- Verify API URL in built files matches server

### CORS Errors
- Update `CORS_ORIGIN` in backend `.env`
- Restart application pool
- Clear browser cache

## 📞 Need Help?

See `IIS_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

