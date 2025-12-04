# 🔧 Fix Backend 500 Error

## Problem
The backend is now reachable (good!), but it's returning a 500 Internal Server Error. This is usually because:

1. **Missing Database Connection** - `DATABASE_URL` environment variable not set
2. **Missing JWT Secret** - `JWT_SECRET` environment variable not set
3. **Database not accessible** - PostgreSQL database not configured for Vercel

## Solution

### Step 1: Check Backend Environment Variables in Vercel

Go to your **backend** project on Vercel:
1. Go to: https://vercel.com/dashboard
2. Click your **backend** project (`plt-3-dec-backend`)
3. Go to **Settings** → **Environment Variables**

### Step 2: Required Environment Variables

Your backend needs these environment variables:

#### 1. **DATABASE_URL** (Critical!)
```
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
```

You need a **PostgreSQL database**. Options:
- **Vercel Postgres** (Recommended - Easy setup)
- **Supabase** (Free tier available)
- **Neon** (Free tier available)
- **Railway** (Free tier available)
- **Your own PostgreSQL server**

#### 2. **JWT_SECRET** (Critical!)
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
```
Generate a random string (minimum 32 characters)

#### 3. **JWT_EXPIRE** (Optional - has default)
```
JWT_EXPIRE=7d
```

#### 4. **CORS_ORIGIN** (Optional - code now handles this)
```
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Step 3: Setup Database (Choose One)

#### Option A: Vercel Postgres (Easiest)

1. In your backend Vercel project → **Storage** tab
2. Click **"Create Database"** → Select **"Postgres"**
3. Click **"Create"**
4. Vercel will automatically add the `DATABASE_URL` environment variable
5. After database is created, run migrations:
   - Go to Vercel dashboard → Your backend project
   - Go to **Deployments** → Click latest deployment
   - Check logs to see if migrations ran
   - Or use Vercel CLI to run migrations

#### Option B: Supabase (Free)

1. Go to: https://supabase.com
2. Create account and new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
5. Add to Vercel as `DATABASE_URL`
6. Run migrations using Supabase SQL editor or locally

#### Option C: Neon (Free)

1. Go to: https://neon.tech
2. Create account and new project
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`
5. Run migrations

### Step 4: Generate JWT Secret

Generate a secure random string:

**On Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

Or use an online generator: https://randomkeygen.com/

### Step 5: Run Database Migrations

After setting up the database, you need to run Prisma migrations:

**Option 1: Using Vercel CLI (Recommended)**
```bash
cd backend
npx vercel env pull .env.local
npx prisma migrate deploy
```

**Option 2: Using Supabase/Neon Dashboard**
- Copy the migration SQL from `backend/prisma/migrations`
- Run it in the database SQL editor

**Option 3: Add to Vercel Build Command**
Update `backend/package.json` build script to run migrations:
```json
"vercel-build": "prisma generate && prisma migrate deploy && tsc"
```

### Step 6: Seed Database (Optional)

To create initial users (admin, superadmin), seed the database:

```bash
cd backend
npx vercel env pull .env.local
npx prisma db seed
```

Or add to Vercel build:
```json
"vercel-build": "prisma generate && prisma migrate deploy && prisma db seed && tsc"
```

## Quick Setup with Vercel Postgres

1. **Create Postgres Database:**
   - Backend project → Storage → Create Database → Postgres → Create

2. **Add JWT_SECRET:**
   - Settings → Environment Variables
   - Key: `JWT_SECRET`
   - Value: (generate a random 40-character string)
   - Save

3. **Run Migrations:**
   - Go to Functions/Deployments
   - Check logs or use CLI

4. **Redeploy Backend**

## Verify Backend is Working

Test the health endpoint:
```
https://plt-3-dec-backend.vercel.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Default Login Credentials (After Seeding)

- **Super Admin**: `superadmin@ikf.com` / `password123`
- **Admin**: `admin@ikf.com` / `password123`

---

**The 500 error will be fixed once you set up the database and environment variables!** 🎯

