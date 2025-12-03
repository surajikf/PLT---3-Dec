# 🚀 Quick Fix for Login Issue

## The Problem
1. Frontend is calling `localhost:5000` instead of your Vercel backend
2. Backend CORS is blocking the Vercel frontend URL

## ✅ Solution - 3 Steps

### Step 1: Set Frontend Environment Variable

1. Go to: https://vercel.com/dashboard
2. Click your **frontend** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://plt-3-dec-backend.vercel.app/api`
     - ⚠️ Replace `plt-3-dec-backend.vercel.app` with your actual backend URL
   - **Environment**: Check all (Production, Preview, Development)
6. Click **"Save"**
7. Go to **Deployments** → Click **"..."** → **"Redeploy"**

### Step 2: Find Your Backend URL

If you don't know your backend URL:
1. Go to Vercel Dashboard
2. Click your **backend** project (`plt-3-dec-backend`)
3. Look at the "Domains" section
4. Copy the URL (something like `https://plt-3-dec-backend.vercel.app`)
5. Add `/api` at the end for the VITE_API_URL value

### Step 3: Commit & Push Backend CORS Fix

The backend code has been updated to allow Vercel URLs. Just commit and push:

```bash
git add backend/src/server.ts
git commit -m "Fix CORS to allow Vercel frontend URLs"
git push
```

This will automatically redeploy your backend.

## Test Login

After both redeployments complete (2-3 minutes):
- Go to your frontend URL
- Login with:
  - **Email**: `admin@ikf.com`
  - **Password**: `password123`

---

**The backend CORS now automatically allows any Vercel URL, so that part should work!** 🎉

The main thing is setting the `VITE_API_URL` in your frontend Vercel project.

