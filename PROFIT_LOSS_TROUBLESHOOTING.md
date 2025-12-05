# 🔧 Profit & Loss Page Troubleshooting Guide

## 🚨 Common Issues Why Profit & Loss Page Won't Open

### Issue 1: Access Denied - Wrong User Role ❌

**Symptom:** Page shows "Access denied" or redirects to dashboard

**Cause:** Profit & Loss page requires **SUPER_ADMIN** or **ADMIN** role only.

**Solution:**
1. Check your current user role:
   - Open browser console (F12)
   - Check localStorage: `localStorage.getItem('user')`
   - Look for `"role"` field

2. Login with an admin account:
   - Email: `admin@ikf.com` or `superadmin@ikf.com`
   - Password: Check your database seed data

3. Verify role in database:
   ```sql
   SELECT email, role FROM User WHERE email = 'your-email@example.com';
   ```

---

### Issue 2: Backend Server Not Running ❌

**Symptom:** Page loads but shows "Error Loading Data" or network errors

**Check:**
1. Is backend server running?
   ```powershell
   # Check if port 5000 is in use
   netstat -ano | findstr :5000
   ```

2. Start backend server:
   ```powershell
   cd backend
   npm run dev
   ```

3. Test API endpoint manually:
   - Open browser: `http://localhost:5000/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

---

### Issue 3: API Endpoints Returning Errors ❌

**Symptom:** Console shows 401, 403, 404, or 500 errors

**Test each endpoint:**

1. **Dashboard endpoint:**
   ```powershell
   # Get your auth token from browser localStorage first
   $token = "YOUR_JWT_TOKEN_HERE"
   $headers = @{
       Authorization = "Bearer $token"
   }
   Invoke-WebRequest -Uri "http://localhost:5000/api/profit-loss/dashboard" -Headers $headers
   ```

2. **Projects endpoint:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/api/profit-loss/projects" -Headers $headers
   ```

3. **Employees endpoint:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/api/profit-loss/employees" -Headers $headers
   ```

**Common Error Codes:**

- **401 Unauthorized:** Token expired or invalid
  - Solution: Logout and login again
  
- **403 Forbidden:** User role is not ADMIN or SUPER_ADMIN
  - Solution: Use admin account
  
- **404 Not Found:** Route not registered
  - Solution: Check `backend/src/server.ts` line 98
  
- **500 Internal Server Error:** Backend error
  - Check backend console for error details

---

### Issue 4: Authentication Token Missing/Invalid ❌

**Symptom:** All API calls fail with 401 errors

**Solution:**
1. Clear browser storage and login again
2. Check if token is being sent:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Check request headers for `Authorization: Bearer ...`

3. Check token expiration:
   - JWT tokens expire after 7 days (default)
   - Logout and login to get a new token

---

### Issue 5: Route Not Found in Frontend ❌

**Symptom:** Page shows 404 or navigates to wrong route

**Check:**
1. URL should be: `http://localhost:5173/profit-loss`
2. Route is defined in `frontend/src/App.tsx` at line 94-101

**Verify route exists:**
- Check browser address bar matches exactly: `/profit-loss`
- No trailing slashes: `/profit-loss/` (wrong)

---

### Issue 6: Database Connection Issues ❌

**Symptom:** Backend crashes or returns database errors

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

3. Verify Prisma Client is generated:
   ```powershell
   npx prisma generate
   ```

---

### Issue 7: CORS Errors ❌

**Symptom:** Console shows CORS policy errors

**Solution:**
1. Check `backend/.env`:
   ```env
   CORS_ORIGIN="http://localhost:5173"
   ```

2. Restart backend server after changing CORS_ORIGIN

---

## 🔍 Step-by-Step Diagnostic Process

### Step 1: Check Browser Console

Open browser DevTools (F12) and look for errors:

1. **Console Tab:** Look for red error messages
2. **Network Tab:** Check failed requests
   - Click on failed request
   - Check Status Code (401, 403, 404, 500)
   - Check Response tab for error message

### Step 2: Verify User Role

```javascript
// In browser console:
JSON.parse(localStorage.getItem('user') || '{}').role
```

Should return: `"SUPER_ADMIN"` or `"ADMIN"`

### Step 3: Test API Endpoints

Use browser console or PowerShell:

```javascript
// In browser console (must be logged in):
fetch('http://localhost:5000/api/profit-loss/dashboard', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Step 4: Check Backend Logs

Look at backend console output for:
- Error messages
- Stack traces
- Database connection errors

### Step 5: Verify Route Registration

Check `backend/src/server.ts` line 98:
```typescript
app.use('/api/profit-loss', readLimiter, profitLossRoutes);
```

---

## ✅ Quick Fix Checklist

Run through this checklist:

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] User is logged in with ADMIN or SUPER_ADMIN role
- [ ] JWT token is valid (not expired)
- [ ] Database connection is working
- [ ] API endpoint `/api/profit-loss/dashboard` is accessible
- [ ] No CORS errors in browser console
- [ ] Route `/profit-loss` is accessible in frontend
- [ ] No syntax errors in backend (server starts successfully)

---

## 🧪 Manual Testing

### Test 1: Health Check
```
GET http://localhost:5000/health
Expected: {"status":"ok","timestamp":"..."}
```

### Test 2: Dashboard API (with auth token)
```
GET http://localhost:5000/api/profit-loss/dashboard
Headers: Authorization: Bearer <your-token>
Expected: {"success":true,"data":{...}}
```

### Test 3: Projects API (with auth token)
```
GET http://localhost:5000/api/profit-loss/projects
Headers: Authorization: Bearer <your-token>
Expected: {"success":true,"data":{...}}
```

### Test 4: Frontend Route
```
Navigate to: http://localhost:5173/profit-loss
Expected: Profit & Loss page loads
```

---

## 🐛 Debug Mode

Enable detailed logging:

1. **Backend:** Already logs errors to console
2. **Frontend:** Check browser console for React Query errors
3. **Network:** Check Network tab in DevTools for API responses

---

## 📞 Still Not Working?

If all else fails:

1. **Check exact error message** from browser console
2. **Check backend console** for server-side errors
3. **Verify all dependencies installed:**
   ```powershell
   cd backend
   npm install
   npx prisma generate
   
   cd ../frontend
   npm install
   ```

4. **Try clearing cache:**
   - Clear browser cache
   - Clear localStorage: `localStorage.clear()` in console
   - Logout and login again

5. **Check for TypeScript/compilation errors:**
   ```powershell
   cd backend
   npm run build
   ```

---

## 🎯 Expected Behavior

When working correctly:

1. **URL:** `http://localhost:5173/profit-loss`
2. **Page loads** with loading spinner
3. **Three API calls** are made:
   - `/api/profit-loss/dashboard`
   - `/api/profit-loss/projects`
   - `/api/profit-loss/employees`
4. **Page displays:**
   - Dashboard summary cards
   - Profit/Loss charts
   - Project list with financial data
   - Employee cost analysis

---

**Need more help?** Check the specific error message and search for it above!

