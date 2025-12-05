# 🚀 Quick Start Guide

## ⚡ Fastest Way to Start

### 1. Verify Setup (First Time Only)
```powershell
.\verify-and-fix.ps1
```

### 2. Start Everything
```powershell
.\start-project.ps1
```

That's it! Both servers will start automatically.

## 📋 Manual Start (If Scripts Don't Work)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Wait for: `🚀 Server running on http://localhost:5000`

### Terminal 2 - Frontend  
```bash
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Open Browser
Go to: **http://localhost:5173**

Login with:
- Email: `superadmin@ikf.com`
- Password: `password123`

## ✅ Verify It's Working

1. **Backend Health Check:**
   - Open: http://localhost:5000/health
   - Should show: `{"status":"ok"}`

2. **Frontend:**
   - Should load without errors
   - Dashboard should show data

3. **Check Browser Console (F12):**
   - No red errors
   - Network tab shows successful API calls

## 🔧 If Something Doesn't Work

### Backend Won't Start?
```bash
cd backend
npm run check-db    # Check database
npm run check-health # Full health check
```

### Frontend Shows Errors?
- Check backend is running (http://localhost:5000/health)
- Clear browser cache (Ctrl+Shift+R)
- Check browser console (F12) for errors

### Data Not Loading?
- Make sure you're logged in
- Check Network tab in DevTools
- Verify backend is responding

## 📞 Still Having Issues?

Run the verification script:
```powershell
.\verify-and-fix.ps1
```

It will tell you exactly what's wrong and how to fix it.

