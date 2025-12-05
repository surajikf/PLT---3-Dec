# 🔧 API Troubleshooting Guide - localhost:5000 Not Working

This guide will help you diagnose and fix issues with your backend API at `http://localhost:5000`.

---

## 🚨 Quick Diagnostic Steps

### Step 1: Check if Server is Running

Open PowerShell/Command Prompt and check if port 5000 is in use:

**Windows:**
```powershell
netstat -ano | findstr :5000
```

**Linux/Mac:**
```bash
lsof -i :5000
```

**If something is using port 5000:**
- Note the PID (Process ID) from the output
- Kill the process: `taskkill /PID <PID> /F` (Windows) or `kill <PID>` (Linux/Mac)

---

### Step 2: Check Environment Variables

The server **requires** these environment variables in `backend/.env`:

1. **DATABASE_URL** (required)
2. **JWT_SECRET** (required, minimum 32 characters)

**Check if `.env` file exists:**
```powershell
cd backend
Test-Path .env
```

**If it doesn't exist, create it:**
```powershell
Copy-Item env.example.txt .env
```

---

### Step 3: Verify Environment Variables

Check your `backend/.env` file has all required variables:

```env
# Database (REQUIRED)
DATABASE_URL="mysql://dbo_projectlivetracker:your_password@192.168.2.100:3306/db_projectlivetracker"

# JWT (REQUIRED - minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"

# Optional (have defaults)
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**Common Issues:**
- ❌ Missing `DATABASE_URL` → Server won't start
- ❌ Missing `JWT_SECRET` → Server won't start
- ❌ `JWT_SECRET` less than 32 characters → Server won't start
- ❌ Wrong `DATABASE_URL` format → Server won't start

---

### Step 4: Check if Dependencies are Installed

```powershell
cd backend
npm install
```

**Also generate Prisma Client:**
```powershell
npx prisma generate
```

---

### Step 5: Try Starting the Server

**Start in development mode:**
```powershell
cd backend
npm run dev
```

**What you should see if it works:**
```
✅ Environment variables validated
🚀 Server running on http://localhost:5000
📝 Environment: development
```

**Common errors and solutions:**

#### ❌ Error: "Missing required environment variables: DATABASE_URL"
**Solution:** Create/update `backend/.env` file with `DATABASE_URL`

#### ❌ Error: "Missing required environment variables: JWT_SECRET"
**Solution:** Add `JWT_SECRET` to `backend/.env` (minimum 32 characters)

#### ❌ Error: "JWT_SECRET must be at least 32 characters long"
**Solution:** Make your `JWT_SECRET` longer (32+ characters)

#### ❌ Error: "DATABASE_URL must be a valid MySQL or PostgreSQL connection string"
**Solution:** Check your `DATABASE_URL` starts with `mysql://` or `postgresql://`

#### ❌ Error: "Cannot find module '@prisma/client'"
**Solution:** Run `npx prisma generate` in the backend directory

#### ❌ Error: "ECONNREFUSED" or Database connection error
**Solution:** 
1. Check MySQL server is running
2. Verify `DATABASE_URL` credentials are correct
3. Check network connectivity to database server

---

## 🔍 Diagnostic Commands

### Run Health Check Script

The project includes a health check script:

```powershell
cd backend
npm run check-health
```

This will check:
- ✅ Backend server status
- ✅ Database connection
- ✅ API endpoints

### Manual Health Check

Open browser or use curl:
```powershell
# In browser, visit:
http://localhost:5000/health

# Or using PowerShell:
Invoke-WebRequest -Uri "http://localhost:5000/health"

# Or using curl:
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📋 Complete Setup Checklist

Follow these steps in order:

- [ ] **1. Navigate to backend directory**
  ```powershell
  cd backend
  ```

- [ ] **2. Install dependencies**
  ```powershell
  npm install
  ```

- [ ] **3. Create `.env` file** (if doesn't exist)
  ```powershell
  Copy-Item env.example.txt .env
  ```

- [ ] **4. Update `.env` with correct values**
  - Set `DATABASE_URL` with your MySQL credentials
  - Set `JWT_SECRET` (32+ characters)

- [ ] **5. Generate Prisma Client**
  ```powershell
  npx prisma generate
  ```

- [ ] **6. Check database connection** (optional)
  ```powershell
  npm run check-db
  ```

- [ ] **7. Start the server**
  ```powershell
  npm run dev
  ```

- [ ] **8. Test the API**
  - Open browser: `http://localhost:5000/health`
  - Should see: `{"status":"ok","timestamp":"..."}`

---

## 🔧 Common Fixes

### Fix 1: Server Not Starting - Missing .env File

**Problem:** No `.env` file in backend directory

**Solution:**
```powershell
cd backend
Copy-Item env.example.txt .env
# Then edit .env with your actual values
notepad .env
```

### Fix 2: Port 5000 Already in Use

**Problem:** Another application is using port 5000

**Solution A - Change port:**
Update `backend/.env`:
```env
PORT=5001
```

**Solution B - Kill process using port 5000:**
```powershell
# Find the process
netstat -ano | findstr :5000

# Kill it (replace <PID> with actual Process ID)
taskkill /PID <PID> /F
```

### Fix 3: Database Connection Error

**Problem:** Can't connect to MySQL database

**Solution:**
1. Verify MySQL server is running
2. Check `DATABASE_URL` format is correct
3. Ensure password is URL-encoded (special characters)
4. Test connection manually:
   ```powershell
   mysql -h 192.168.2.100 -u dbo_projectlivetracker -p db_projectlivetracker
   ```

### Fix 4: Prisma Client Not Generated

**Problem:** `@prisma/client` not found

**Solution:**
```powershell
cd backend
npx prisma generate
```

### Fix 5: Environment Variables Not Loading

**Problem:** Changes to `.env` not taking effect

**Solution:**
1. Make sure `.env` is in `backend/` directory (not root)
2. Restart the server (Ctrl+C, then `npm run dev`)
3. Check for typos in variable names (case-sensitive)

---

## 🧪 Test API Endpoints

Once server is running, test these endpoints:

### 1. Health Check (No Auth Required)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health"
```

### 2. Login (Post Request)
```powershell
$body = @{
    email = "admin@ikf.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### 3. Get Projects (Requires Auth Token)
```powershell
# First login to get token, then:
$headers = @{
    Authorization = "Bearer YOUR_TOKEN_HERE"
}
Invoke-WebRequest -Uri "http://localhost:5000/api/projects" -Headers $headers
```

---

## 📞 Still Not Working?

If you've tried everything above and it's still not working:

1. **Check the console output** when running `npm run dev`
   - Look for error messages
   - Check what line it fails on

2. **Check Windows Firewall**
   - Port 5000 might be blocked
   - Temporarily disable firewall to test

3. **Check Node.js version**
   ```powershell
   node --version
   ```
   Should be Node.js 18 or higher

4. **Verify file structure**
   ```
   backend/
   ├── .env              ← Must exist
   ├── src/
   │   └── server.ts     ← Entry point
   ├── prisma/
   │   └── schema.prisma ← Database schema
   └── package.json
   ```

5. **Run with verbose logging**
   Add to `backend/.env`:
   ```env
   NODE_ENV=development
   DEBUG=*
   ```

---

## ✅ Success Indicators

Your API is working correctly when:

- ✅ Server starts without errors
- ✅ Console shows: `🚀 Server running on http://localhost:5000`
- ✅ `http://localhost:5000/health` returns JSON response
- ✅ No error messages in console
- ✅ Can make API calls from frontend

---

**Need more help?** Check the error message in your console and search for it in this guide!

