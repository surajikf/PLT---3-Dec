# 🚀 Quick Fix for localhost:5000 API Not Working

## ✅ What We Know
- ✅ `.env` file exists in backend directory
- ✅ Port 5000 is available (not in use)

## 🔧 Quick Steps to Fix

### Step 1: Check Your .env File

Open `backend/.env` and verify it has:

```env
DATABASE_URL="mysql://dbo_projectlivetracker:YOUR_PASSWORD@192.168.2.100:3306/db_projectlivetracker"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**IMPORTANT:**
- Replace `YOUR_PASSWORD` with your actual MySQL password
- If password has special characters, URL-encode them:
  - `!` = `%21`
  - `@` = `%40`
  - `#` = `%23`
- `JWT_SECRET` must be at least 32 characters

### Step 2: Install Dependencies (if not done)

```powershell
cd backend
npm install
```

### Step 3: Generate Prisma Client

```powershell
npx prisma generate
```

### Step 4: Try Starting the Server

```powershell
npm run dev
```

### Step 5: Check for Errors

**Common errors you might see:**

#### ❌ "Missing required environment variables: DATABASE_URL"
**Fix:** Make sure `DATABASE_URL` is in your `.env` file

#### ❌ "Missing required environment variables: JWT_SECRET"
**Fix:** Add `JWT_SECRET` to your `.env` file (32+ characters)

#### ❌ "JWT_SECRET must be at least 32 characters long"
**Fix:** Make your JWT_SECRET longer. Example:
```
JWT_SECRET="my-super-secret-key-for-production-use-minimum-32-characters-long-12345"
```

#### ❌ Database connection error
**Fix:** 
1. Check MySQL server is running
2. Verify DATABASE_URL credentials
3. Test connection manually:
   ```powershell
   mysql -h 192.168.2.100 -u dbo_projectlivetracker -p db_projectlivetracker
   ```

### Step 6: Test the API

Once server starts, open browser:
```
http://localhost:5000/health
```

Should see:
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 🎯 Most Common Issue

**The server won't start if:**
1. ❌ `.env` file is missing
2. ❌ `DATABASE_URL` is missing or wrong
3. ❌ `JWT_SECRET` is missing or less than 32 characters

**Solution:** Check your `.env` file first!

---

## 📞 Still Having Issues?

Run the health check script:
```powershell
cd backend
npm run check-health
```

This will tell you exactly what's wrong!

