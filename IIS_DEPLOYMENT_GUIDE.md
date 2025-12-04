# IIS Deployment Guide for Windows Server

This guide will help you deploy the IKF Project Livetracker application to Windows Server using IIS (Internet Information Services).

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Windows Server with IIS installed
- ✅ Node.js 18+ installed on the server
- ✅ MySQL database accessible from the server (already configured at `192.168.2.100`)
- ✅ Administrator access to the server
- ✅ IIS URL Rewrite module installed
- ✅ IIS Application Request Routing (ARR) module installed (for reverse proxy)

## 🛠️ Step 1: Install Required IIS Modules

### Install URL Rewrite Module
1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module
3. Restart IIS: `iisreset` in PowerShell (as Administrator)

### Install Application Request Routing (ARR)
1. Download from: https://www.iis.net/downloads/microsoft/application-request-routing
2. Install the module
3. Restart IIS: `iisreset` in PowerShell (as Administrator)

### Install iisnode (for Node.js support)
1. Download from: https://github.com/Azure/iisnode/releases
2. Install the appropriate version (x64 for 64-bit Windows Server)
3. Restart IIS: `iisreset` in PowerShell (as Administrator)

## 📦 Step 2: Prepare the Application

### 2.1 Build the Backend

On your development machine or on the server:

```powershell
cd backend
npm install
npm run build
npx prisma generate
```

### 2.2 Build the Frontend

```powershell
cd frontend
npm install
npm run build
```

This creates a `dist` folder with production-ready static files.

## 📁 Step 3: Deploy Files to Server

### Option A: Copy Files Manually

1. Create deployment folders on the server:
   ```
   C:\inetpub\wwwroot\plt-api\     (for backend)
   C:\inetpub\wwwroot\plt\          (for frontend)
   ```

2. Copy backend files:
   - Copy entire `backend` folder contents to `C:\inetpub\wwwroot\plt-api\`
   - Ensure `node_modules` is included (or run `npm install --production` on server)

3. Copy frontend build:
   - Copy `frontend\dist\*` contents to `C:\inetpub\wwwroot\plt\`

### Option B: Use Deployment Script

Run the provided `deploy-to-iis.ps1` script (see below).

## ⚙️ Step 4: Configure Backend (API)

### 4.1 Create Production .env File

Create `C:\inetpub\wwwroot\plt-api\.env`:

```env
# Database
DATABASE_URL="mysql://dbo_projectlivetracker:cwF%21ebdaKf32%40%23@192.168.2.100:3306/db_projectlivetracker"

# JWT
JWT_SECRET="your-production-jwt-secret-minimum-32-characters-long-change-this"
JWT_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV=production

# CORS - Update with your domain
CORS_ORIGIN="http://your-server-ip,http://your-domain.com"
```

**⚠️ Important:** 
- Change `JWT_SECRET` to a strong random string
- Update `CORS_ORIGIN` with your actual server IP/domain

### 4.2 Create IIS Application

1. Open **IIS Manager**
2. Right-click **Default Web Site** → **Add Application**
3. Configure:
   - **Alias:** `plt-api`
   - **Application pool:** Create new or use existing
   - **Physical path:** `C:\inetpub\wwwroot\plt-api`
4. Click **OK**

### 4.3 Configure Application Pool

1. Select the application pool for `plt-api`
2. Right-click → **Advanced Settings**
3. Set:
   - **.NET CLR Version:** No Managed Code
   - **Managed Pipeline Mode:** Integrated
   - **Start Mode:** AlwaysRunning (optional, for better performance)
4. Click **OK**

### 4.4 Copy web.config for Backend

Copy `backend\web.config` (provided in this guide) to `C:\inetpub\wwwroot\plt-api\web.config`

## 🌐 Step 5: Configure Frontend

### 5.1 Create IIS Application

1. Open **IIS Manager**
2. Right-click **Default Web Site** → **Add Application**
3. Configure:
   - **Alias:** `plt` (or use root `/`)
   - **Application pool:** Create new or use existing
   - **Physical path:** `C:\inetpub\wwwroot\plt`
4. Click **OK**

### 5.2 Configure Application Pool

1. Select the application pool for `plt`
2. Right-click → **Advanced Settings**
3. Set:
   - **.NET CLR Version:** No Managed Code
   - **Managed Pipeline Mode:** Integrated
4. Click **OK**

### 5.3 Copy web.config for Frontend

Copy `frontend\web.config` (provided in this guide) to `C:\inetpub\wwwroot\plt\web.config`

### 5.4 Update Frontend API URL

Before building, update `frontend\.env.production` (create if needed):

```env
VITE_API_URL=http://your-server-ip/plt-api/api
```

Or if using a domain:

```env
VITE_API_URL=http://your-domain.com/plt-api/api
```

Then rebuild the frontend:

```powershell
cd frontend
npm run build
```

Copy the new `dist` folder contents to the server.

## 🔧 Step 6: Configure URL Rewrite Rules

The `web.config` files include URL rewrite rules, but verify:

1. **Backend:** Should handle `/api/*` routes correctly
2. **Frontend:** Should rewrite all routes to `index.html` for React Router

## 🔐 Step 7: Set Permissions

Set proper permissions for IIS to access files:

```powershell
# Run as Administrator
icacls "C:\inetpub\wwwroot\plt-api" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\plt" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

## 🚀 Step 8: Test the Deployment

### 8.1 Test Backend API

Open browser and navigate to:
```
http://your-server-ip/plt-api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 8.2 Test Frontend

Open browser and navigate to:
```
http://your-server-ip/plt
```

Should load the application login page.

### 8.3 Test API from Frontend

1. Open browser developer tools (F12)
2. Navigate to Network tab
3. Try to login
4. Verify API calls go to `/plt-api/api/...`

## 🐛 Troubleshooting

### Backend Not Starting

1. Check Windows Event Viewer → Applications and Services Logs → iisnode
2. Check `C:\inetpub\wwwroot\plt-api\logs\` for error logs
3. Verify Node.js is in PATH: `node --version` in PowerShell
4. Verify `.env` file exists and has correct values
5. Check application pool is running

### Frontend Not Loading

1. Check browser console for errors
2. Verify `web.config` is in the frontend folder
3. Verify all files were copied from `dist` folder
4. Check IIS logs: `C:\inetpub\logs\LogFiles\`

### CORS Errors

1. Update `CORS_ORIGIN` in backend `.env` with correct origins
2. Restart the application pool
3. Clear browser cache

### Database Connection Errors

1. Verify MySQL server is accessible from the server
2. Check firewall rules allow port 3306
3. Verify database credentials in `.env`
4. Test connection: `mysql -h 192.168.2.100 -u dbo_projectlivetracker -p`

### 500 Internal Server Error

1. Enable detailed errors in `web.config` (temporarily)
2. Check iisnode logs
3. Verify all dependencies are installed: `npm install --production` in backend folder

## 📝 Step 9: Configure SSL (Optional but Recommended)

1. Install SSL certificate in IIS
2. Create HTTPS bindings for both applications
3. Update `CORS_ORIGIN` to use HTTPS
4. Update frontend `VITE_API_URL` to use HTTPS
5. Rebuild and redeploy frontend

## 🔄 Step 10: Set Up Auto-Start (Optional)

To ensure the application starts automatically:

1. In IIS Manager, select the application pool
2. Right-click → **Advanced Settings**
3. Set **Start Mode:** AlwaysRunning
4. Set **Idle Timeout:** 0 (to prevent shutdown)

## 📊 Monitoring

### View Logs

- **iisnode logs:** `C:\inetpub\wwwroot\plt-api\logs\`
- **IIS logs:** `C:\inetpub\logs\LogFiles\`
- **Windows Event Viewer:** Applications and Services Logs → iisnode

### Performance Monitoring

- Use IIS Manager → Worker Processes to monitor CPU/Memory
- Use Performance Monitor for detailed metrics

## 🔄 Updating the Application

1. Build new versions on development machine
2. Stop the application pool (optional, for zero downtime)
3. Copy new files to server
4. Run `npm install --production` in backend folder (if dependencies changed)
5. Run `npx prisma generate` in backend folder (if schema changed)
6. Start the application pool
7. Test the application

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review IIS and iisnode logs
3. Verify all prerequisites are installed
4. Ensure file permissions are correct

---

**Next Steps:** After successful deployment, consider:
- Setting up Windows Firewall rules
- Configuring backup procedures
- Setting up monitoring/alerting
- Documenting your specific server configuration

