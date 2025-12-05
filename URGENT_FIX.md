# 🚨 URGENT: Backend Server Not Running

## ❌ Current Error
```
ERR_CONNECTION_REFUSED
GET http://localhost:5000/api/projects
```

**This means:** The backend server is NOT running on port 5000.

## ✅ IMMEDIATE FIX

### Step 1: Open a NEW Terminal Window

### Step 2: Start Backend Server
```bash
cd backend
npm run dev
```

**You should see:**
```
🚀 Server running on http://localhost:5000
📝 Environment: development
```

### Step 3: Verify Backend is Running
Open in browser: **http://localhost:5000/health**

Should show: `{"status":"ok"}`

### Step 4: Refresh Frontend
Go back to: **http://localhost:5173** and refresh the page.

## 🎯 Quick Start Script

Or use the automated script:
```powershell
.\start-project.ps1
```

This starts both servers automatically.

## ⚠️ Important Notes

1. **Backend MUST be running** for frontend to work
2. **Keep the backend terminal open** - don't close it
3. **Both servers need to run simultaneously:**
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`

## 🔍 Verify It's Working

After starting backend:
1. Check: http://localhost:5000/health (should show `{"status":"ok"}`)
2. Refresh frontend page
3. Data should load without errors

---

**The React Router warnings are just deprecation notices - they won't break anything. The main issue is the backend server not running.**

