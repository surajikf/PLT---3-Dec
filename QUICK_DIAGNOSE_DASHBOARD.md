# ⚡ Quick Diagnosis: Dashboard Data Load Error

## 🔍 The Error

```
Failed to load some data
Some dashboard data couldn't be loaded. Please try refreshing or contact support if the problem persists.
```

This happens when **ONE of these API calls fails**:
1. `/api/projects` - Loading projects
2. `/api/timesheets` - Loading timesheets

---

## 🚀 Quick Fix Steps (Try These First)

### Step 1: Check Browser Console

Press **F12** → **Console tab** → Look for red errors

### Step 2: Check Network Tab

Press **F12** → **Network tab** → Look for:
- `/api/projects` - Check Status (should be 200)
- `/api/timesheets` - Check Status (should be 200)

**Failed requests will be red with error status codes**

### Step 3: Try the Retry Button

Click **"Retry loading data"** button on the error banner

### Step 4: Refresh the Page

Press **Ctrl+Shift+R** (hard refresh)

### Step 5: Logout and Login Again

- Token might be expired
- Get fresh authentication token

---

## 🔧 Most Common Issues

### Issue 1: Backend Server Not Running ❌

**Check:**
```powershell
netstat -ano | findstr :5000
```

**Fix:**
```powershell
cd backend
npm run dev
```

### Issue 2: Token Expired ❌

**Fix:** Logout and login again

### Issue 3: Database Connection Failed ❌

**Check backend console** for database errors

---

## 🧪 Quick Test (Copy-Paste in Browser Console)

Open browser console (F12) and paste this:

```javascript
// Test which API is failing
const token = localStorage.getItem('token');

async function testAPIs() {
  console.log('🔍 Testing API endpoints...\n');
  
  // Test Projects
  try {
    const projectsRes = await fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const projectsData = await projectsRes.json();
    console.log('✅ Projects API:', projectsRes.status, projectsRes.ok ? 'OK' : 'FAILED');
    if (!projectsRes.ok) console.error('Projects Error:', projectsData);
  } catch (err) {
    console.error('❌ Projects API Error:', err.message);
  }
  
  // Test Timesheets
  try {
    const timesheetsRes = await fetch('http://localhost:5000/api/timesheets', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const timesheetsData = await timesheetsRes.json();
    console.log('✅ Timesheets API:', timesheetsRes.status, timesheetsRes.ok ? 'OK' : 'FAILED');
    if (!timesheetsRes.ok) console.error('Timesheets Error:', timesheetsData);
  } catch (err) {
    console.error('❌ Timesheets API Error:', err.message);
  }
}

testAPIs();
```

This will tell you exactly which API is failing!

---

## ✅ Quick Checklist

- [ ] Backend running? (`npm run dev` in backend folder)
- [ ] Health endpoint works? (`http://localhost:5000/health`)
- [ ] Logged in? (Token in localStorage)
- [ ] Check Network tab for failed requests
- [ ] Check browser console for errors
- [ ] Try retry button
- [ ] Try logout/login again

---

**See `DASHBOARD_DATA_LOAD_ERROR.md` for detailed troubleshooting guide!**

