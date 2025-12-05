# 🔍 Quick Check: Profit & Loss Page Not Opening

## ⚡ Quick Diagnostic Commands

### 1. Check Backend Server Status
```powershell
# Check if backend is running on port 5000
netstat -ano | findstr :5000
```

### 2. Check Your User Role
Open browser console (F12) and run:
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Your role:', user.role);
console.log('Required roles: SUPER_ADMIN or ADMIN');
```

### 3. Test API Endpoint (in browser console)
```javascript
fetch('http://localhost:5000/api/profit-loss/dashboard', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ API Working:', data);
})
.catch(err => {
  console.error('❌ API Error:', err);
});
```

### 4. Check Browser Console Errors
- Press F12
- Go to Console tab
- Look for red errors
- Check Network tab for failed requests

---

## 🎯 Most Common Issues

### ❌ Issue: "Access Denied" or Redirect to Dashboard
**Cause:** User is not ADMIN or SUPER_ADMIN

**Fix:** Login with admin account:
- Email: `admin@ikf.com` or `superadmin@ikf.com`
- Password: Check your seed data (usually `password123`)

### ❌ Issue: "Failed to load" or Network Errors
**Cause:** Backend server not running

**Fix:**
```powershell
cd backend
npm run dev
```

### ❌ Issue: 401 Unauthorized Errors
**Cause:** Token expired or missing

**Fix:** Logout and login again

### ❌ Issue: 404 Not Found
**Cause:** Route not registered

**Fix:** Check `backend/src/server.ts` line 98 should have:
```typescript
app.use('/api/profit-loss', readLimiter, profitLossRoutes);
```

---

## ✅ Quick Fix Steps

1. **Start Backend:**
   ```powershell
   cd backend
   npm run dev
   ```
   Should see: `🚀 Server running on http://localhost:5000`

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Login as Admin:**
   - Use admin credentials
   - Verify role is ADMIN or SUPER_ADMIN

4. **Navigate to Page:**
   - URL: `http://localhost:5173/profit-loss`
   - Should load the page

---

## 🔧 Still Not Working?

1. **Check browser console** (F12) for errors
2. **Check backend console** for error messages
3. **See detailed guide:** `PROFIT_LOSS_TROUBLESHOOTING.md`

