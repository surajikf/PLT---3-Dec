# 🚨 CRITICAL: Backend Server Must Be Running

## ❌ Current Error
```
ERR_CONNECTION_REFUSED
GET http://localhost:5000/api/projects
GET http://localhost:5000/api/timesheets
GET http://localhost:5000/api/users
```

**This means:** The backend server is **NOT running** on port 5000.

## ✅ SOLUTION: Start Backend Server

### Option 1: Quick Start Script
```powershell
.\start-project.ps1
```

### Option 2: Manual Start

**Open a NEW terminal window and run:**
```bash
cd backend
npm run dev
```

**You MUST see this output:**
```
🚀 Server running on http://localhost:5000
📝 Environment: development
```

**Keep this terminal open!** Don't close it.

## ✅ Verify Backend is Running

1. **Open in browser:** http://localhost:5000/health
2. **Should show:** `{"status":"ok","timestamp":"..."}`

## ✅ Then Refresh Frontend

1. Go back to: http://localhost:5173
2. Press **Ctrl + Shift + R** (hard refresh)
3. Data should now load!

## 📋 Important Notes

- ✅ **Backend MUST be running** for frontend to work
- ✅ **Keep backend terminal open** - closing it stops the server
- ✅ **Both servers run simultaneously:**
  - Backend: `http://localhost:5000` (Terminal 1)
  - Frontend: `http://localhost:5173` (Terminal 2 or browser)

## 🔍 Troubleshooting

### Backend won't start?
1. Check if port 5000 is in use
2. Verify `backend/.env` file exists
3. Check database connection: `cd backend && npm run check-db`

### Still getting errors?
1. Make sure backend shows: `🚀 Server running on http://localhost:5000`
2. Test: http://localhost:5000/health (should show `{"status":"ok"}`)
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for new errors

---

**The React Router warnings are just deprecation notices - they won't break anything. The main issue is the backend server not running.**

