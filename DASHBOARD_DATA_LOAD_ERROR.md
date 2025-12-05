# 🔧 Dashboard "Failed to Load Some Data" Error - Fix Guide

## 🚨 Problem

You're seeing this error on the Dashboard:
```
Failed to load some data

Some dashboard data couldn't be loaded. Please try refreshing or contact support if the problem persists.
```

## 🔍 Root Cause

This error appears when **one or both** of these API calls fail:
1. `/api/projects` - Loading all projects
2. `/api/timesheets` - Loading all timesheets

The Dashboard page checks if either fails and shows the error banner.

## ✅ Quick Diagnostic Steps

### Step 1: Check Browser Console for Errors

1. **Open Browser DevTools** (Press F12)
2. **Go to Console tab** - Look for red error messages
3. **Check Network tab** - Look for failed requests (red status codes)

### Step 2: Identify Which API is Failing

In the **Network tab**:
- Filter for "projects" - Check if `/api/projects` returns an error
- Filter for "timesheets" - Check if `/api/timesheets` returns an error

Look for status codes:
- **401** = Authentication error (token expired)
- **403** = Permission denied (wrong role)
- **404** = Route not found
- **500** = Server error
- **Network Error** = Server not running or CORS issue

### Step 3: Test API Endpoints Manually

Open browser console (F12) and run:

```javascript
// Test Projects API
fetch('http://localhost:5000/api/projects', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => {
  console.log('Projects Status:', r.status);
  return r.json();
})
.then(data => console.log('Projects Data:', data))
.catch(err => console.error('Projects Error:', err));

// Test Timesheets API
fetch('http://localhost:5000/api/timesheets', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => {
  console.log('Timesheets Status:', r.status);
  return r.json();
})
.then(data => console.log('Timesheets Data:', data))
.catch(err => console.error('Timesheets Error:', err));
```

---

## 🔧 Common Fixes

### Fix 1: Authentication Token Expired

**Symptom:** All API calls return 401 Unauthorized

**Solution:**
1. Logout from the application
2. Login again to get a fresh token
3. Refresh the dashboard

### Fix 2: Backend Server Not Running

**Symptom:** Network errors, connection refused

**Solution:**
```powershell
cd backend
npm run dev
```

Verify server is running:
- Check terminal shows: `🚀 Server running on http://localhost:5000`
- Open: `http://localhost:5000/health` in browser

### Fix 3: Permission/Role Issues

**Symptom:** 403 Forbidden errors

**Check your role:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('user') || '{}').role
```

**Note:** Different roles see different data:
- **TEAM_MEMBER**: Only sees own projects and timesheets
- **PROJECT_MANAGER**: Only sees assigned projects
- **ADMIN/SUPER_ADMIN**: Sees all data

### Fix 4: Database Connection Issues

**Symptom:** 500 Internal Server Error, backend crashes

**Check:**
1. Database connection in `backend/.env`:
   ```env
   DATABASE_URL="mysql://..."
   ```

2. Test database connection:
   ```powershell
   cd backend
   npm run check-db
   ```

### Fix 5: CORS Errors

**Symptom:** CORS policy errors in console

**Solution:**
1. Check `backend/.env`:
   ```env
   CORS_ORIGIN="http://localhost:5173"
   ```

2. Restart backend server

### Fix 6: Empty Database

**Symptom:** API returns empty arrays `[]`

**Solution:**
- This is normal if you have no projects or timesheets yet
- The error banner shouldn't show if API returns successfully (even if empty)
- If error shows with empty data, there might be a frontend bug

---

## 🧪 Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Should see LISTENING status
```

If not running:
```powershell
cd backend
npm run dev
```

### Step 2: Test Health Endpoint

Open browser:
```
http://localhost:5000/health
```

Should see:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Step 3: Check Backend Console

Look at backend terminal for:
- Error messages
- Database connection errors
- Stack traces

### Step 4: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh dashboard page
4. Look for:
   - `/api/projects` - Check Status column
   - `/api/timesheets` - Check Status column
5. Click on failed request to see error details

### Step 5: Check Authentication

```javascript
// In browser console:
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

console.log('Token exists:', !!token);
console.log('User role:', user.role);
```

If token is missing or null:
- Logout and login again

---

## 🎯 Expected Behavior

**When Working Correctly:**

1. Dashboard loads without error banner
2. Network tab shows:
   - `/api/projects` → Status: 200
   - `/api/timesheets` → Status: 200
3. Dashboard displays:
   - Project statistics cards
   - Timesheet statistics
   - Charts and graphs
   - Activity lists

---

## 📋 Quick Checklist

Run through this checklist:

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Backend shows no errors in console
- [ ] Health endpoint works: `http://localhost:5000/health`
- [ ] User is logged in (token exists in localStorage)
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows 200 status for `/api/projects`
- [ ] Network tab shows 200 status for `/api/timesheets`
- [ ] No 401/403/404/500 errors in Network tab

---

## 🔍 Detailed Error Messages

### Error: "Failed to load projects"
**Cause:** `/api/projects` endpoint failed

**Check:**
- Backend route is registered in `server.ts`
- User has permission to view projects
- Database connection is working

### Error: "Failed to load timesheets"
**Cause:** `/api/timesheets` endpoint failed

**Check:**
- Backend route is registered in `server.ts`
- User has permission to view timesheets
- Database connection is working

### Error: Network Error
**Cause:** Backend server not reachable

**Check:**
- Backend server is running
- Correct API URL in frontend `.env`: `VITE_API_URL=http://localhost:5000/api`
- No firewall blocking port 5000

---

## 🚀 Quick Fixes to Try

### Fix 1: Clear Cache and Reload

1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear localStorage:
   ```javascript
   // In browser console:
   localStorage.clear();
   ```
3. Refresh page and login again

### Fix 2: Restart Everything

1. Stop backend server (Ctrl+C)
2. Stop frontend server (Ctrl+C)
3. Restart backend: `cd backend && npm run dev`
4. Restart frontend: `cd frontend && npm run dev`
5. Hard refresh browser (Ctrl+Shift+R)

### Fix 3: Check for Backend Errors

Look at backend console output for:
- Database connection errors
- Prisma errors
- Route registration errors
- Authentication middleware errors

---

## 📞 Still Not Working?

1. **Copy the exact error message** from browser console
2. **Check backend console** for error logs
3. **Check Network tab** for:
   - Which endpoint is failing
   - Status code
   - Response message
4. **Share these details** for further help

---

**Most Common Issue:** Backend server not running or authentication token expired. Start there! ✅

