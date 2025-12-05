# How to Start the Application

## ⚠️ IMPORTANT: Both servers must be running for the application to work!

## Step 1: Start Backend Server

Open a **new terminal window** and run:

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:5000
📝 Environment: development
```

**If you see errors:**
- Check if port 5000 is already in use
- Verify `.env` file exists in `backend/` folder
- Check database connection in `.env` file

## Step 2: Start Frontend Server

Open **another terminal window** and run:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Verify Everything is Working

1. **Check Backend Health:**
   ```bash
   cd backend
   npm run check-health
   ```
   Should show: ✅ Backend Server: Running

2. **Open Browser:**
   - Go to: http://localhost:5173
   - Login with: `superadmin@ikf.com` / `password123`

3. **Check Browser Console:**
   - Press F12 to open Developer Tools
   - Look for any red errors
   - Check Network tab for failed requests

## Troubleshooting

### Backend Not Starting?

1. **Check if port 5000 is in use:**
   ```bash
   netstat -ano | findstr :5000
   ```
   If something is using it, either:
   - Stop that process
   - Change PORT in `backend/.env`

2. **Check database connection:**
   ```bash
   cd backend
   npm run check-db
   ```

3. **Check for errors in terminal:**
   - Look for red error messages
   - Common issues: missing `.env`, wrong database credentials

### Frontend Can't Connect to Backend?

1. **Verify backend is running:**
   - Open: http://localhost:5000/health
   - Should show: `{"status":"ok","timestamp":"..."}`

2. **Check CORS:**
   - Backend should allow `http://localhost:5173`
   - Check `backend/.env` for `CORS_ORIGIN`

3. **Check API URL:**
   - Frontend uses: `http://localhost:5000/api` by default
   - Can be changed in `frontend/.env` with `VITE_API_URL`

### Data Not Loading?

1. **Check authentication:**
   - Make sure you're logged in
   - Token should be in localStorage (check DevTools)

2. **Check network requests:**
   - Open DevTools → Network tab
   - Look for failed requests (red)
   - Check error messages

3. **Check rate limiting:**
   - If you see 429 errors, wait 15 minutes or restart backend

## Quick Start Script (Windows PowerShell)

Save this as `start-all.ps1` in project root:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers starting in new windows..."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
```

Then run: `.\start-all.ps1`

