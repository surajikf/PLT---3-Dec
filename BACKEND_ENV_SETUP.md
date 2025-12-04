# 🚀 Quick Backend Environment Setup Guide

## The Problem
Backend is returning **500 Internal Server Error** because it's missing required environment variables.

## Required Environment Variables

Add these to your **backend** Vercel project:

### 1. DATABASE_URL (Required)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

**Easiest Option: Use Vercel Postgres**
1. Go to your backend project on Vercel
2. Click **"Storage"** tab
3. Click **"Create Database"** → **"Postgres"**
4. Click **"Create"**
5. Vercel automatically adds `DATABASE_URL` environment variable!

### 2. JWT_SECRET (Required)
Generate a random secret (minimum 32 characters):

**PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

Copy the output and add as:
- **Key**: `JWT_SECRET`
- **Value**: (paste the generated string)

### 3. JWT_EXPIRE (Optional)
- **Key**: `JWT_EXPIRE`
- **Value**: `7d`

### 4. CORS_ORIGIN (Optional - Code handles this now)
- **Key**: `CORS_ORIGIN`
- **Value**: `https://your-frontend-url.vercel.app`

## Quick Steps

1. **Create Postgres Database:**
   - Backend project → **Storage** → **Create Database** → **Postgres**

2. **Add JWT_SECRET:**
   - **Settings** → **Environment Variables** → **Add New**
   - Key: `JWT_SECRET`
   - Value: (generate using command above)
   - Environment: All
   - Save

3. **Redeploy Backend:**
   - Go to **Deployments**
   - Click **"..."** → **"Redeploy"**

4. **Run Migrations:**
   After redeployment, you need to run database migrations. Options:
   
   **Option A: Use Vercel CLI**
   ```bash
   cd backend
   npx vercel env pull .env.local
   npx prisma migrate deploy
   ```
   
   **Option B: Check Vercel logs**
   - Go to deployment logs
   - See if migrations ran automatically

5. **Seed Database (Optional):**
   To create default users:
   ```bash
   cd backend
   npx prisma db seed
   ```

## After Setup

1. Test backend: `https://your-backend.vercel.app/health`
2. Should return: `{"status":"ok","timestamp":"..."}`
3. Try login again with: `admin@ikf.com` / `password123`

## Alternative: Use Supabase (Free)

If you prefer Supabase:
1. Go to https://supabase.com
2. Create account → New project
3. Settings → Database → Copy connection string
4. Add to Vercel as `DATABASE_URL`
5. Run migrations in Supabase SQL editor

---

**Once DATABASE_URL and JWT_SECRET are set, the 500 error will be fixed!** ✅

