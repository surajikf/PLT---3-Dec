# ✅ Project Setup Complete - Verification Guide

## 🎯 Quick Start

### Option 1: Automated Start (Recommended)
```powershell
.\start-project.ps1
```
This will start both backend and frontend in separate windows.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## ✅ Verification Checklist

Run this to verify everything is set up correctly:
```powershell
.\verify-and-fix.ps1
```

## 🔧 Configuration

### Backend Configuration (`backend/.env`)

Required settings:
```env
DATABASE_URL="mysql://dbo_projectlivetracker:cwF%21ebdaKf32%40%23@192.168.2.100:3306/db_projectlivetracker"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**Important:** Special characters in password must be URL-encoded:
- `!` = `%21`
- `@` = `%40`
- `#` = `%23`

### Frontend Configuration

No configuration needed - uses `http://localhost:5000/api` by default.

To customize, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🗄️ Database

**Connection Details:**
- Server: `192.168.2.100`
- Database: `db_projectlivetracker`
- Username: `dbo_projectlivetracker`
- Password: `cwF!ebdaKf32@#` (URL-encoded in connection string)

**Verify Database:**
```bash
cd backend
npm run check-db
```

## 🚀 Health Checks

### Check Backend Health
```bash
cd backend
npm run check-health
```

### Check Database
```bash
cd backend
npm run check-db
```

### Check Resources
```bash
cd backend
npm run check-resources
```

## 🔐 Default Login Credentials

- **Super Admin:** `superadmin@ikf.com` / `password123`
- **Admin:** `admin@ikf.com` / `password123`
- **Project Manager:** `pm@ikf.com` / `password123`
- **Team Member:** `team@ikf.com` / `password123`

## 📊 Current Data

Based on last check:
- ✅ 252 Users
- ✅ 76 Projects
- ✅ 6,621 Timesheets
- ✅ 71 Customers
- ✅ 8 Departments

## 🐛 Troubleshooting

### Backend Not Starting?

1. **Check port 5000:**
   ```powershell
   netstat -ano | findstr :5000
   ```

2. **Check .env file exists:**
   ```powershell
   Test-Path backend\.env
   ```

3. **Check database connection:**
   ```bash
   cd backend
   npm run check-db
   ```

### Frontend Can't Connect?

1. **Verify backend is running:**
   - Open: http://localhost:5000/health
   - Should show: `{"status":"ok"}`

2. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Clear browser cache:**
   - Hard refresh: `Ctrl + Shift + R`
   - Or clear localStorage

### Data Not Loading?

1. **Check authentication:**
   - Make sure you're logged in
   - Check DevTools → Application → Local Storage for `token`

2. **Check rate limiting:**
   - If you see 429 errors, wait 15 minutes or restart backend
   - Rate limits are very high in development (5000-10000 requests)

3. **Check network requests:**
   - DevTools → Network tab
   - Look for failed requests (red)
   - Check error messages

## 📝 Available Scripts

### Backend Scripts
- `npm run dev` - Start development server
- `npm run check-health` - Check server and database health
- `npm run check-db` - Check database connection
- `npm run check-resources` - List all resources
- `npm run add-realistic-3year` - Add 3 years of realistic dummy data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎉 Everything Should Work Now!

1. ✅ Backend configured with high rate limits for development
2. ✅ Frontend configured to connect to backend
3. ✅ Database connection verified
4. ✅ CORS configured correctly
5. ✅ Error handling improved
6. ✅ Health check scripts created

## 📞 Need Help?

If something still doesn't work:
1. Run `.\verify-and-fix.ps1` to diagnose
2. Check terminal output for errors
3. Check browser console (F12) for errors
4. Verify both servers are running

