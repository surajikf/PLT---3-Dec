# 🔧 Fix Login Issue - Complete Guide

## Problems Identified

1. ❌ Frontend is still calling `localhost:5000` instead of your Vercel backend
2. ❌ Backend CORS is blocking requests from your Vercel frontend

## Solution

### Step 1: Update Backend CORS (Already Fixed in Code)

I've updated the backend code to allow multiple origins. Now you need to:

1. **Set Backend Environment Variable in Vercel:**
   - Go to your **backend** project on Vercel
   - Settings → Environment Variables
   - Add:
     - **Key**: `CORS_ORIGIN`
     - **Value**: `https://plt-3-dec-frontend-hit86pv89-surajs-projects-05327f65.vercel.app,http://localhost:5173`
       - Replace with your actual frontend URL (you can add multiple URLs separated by commas)
   - **Environment**: All
   - Save and **Redeploy backend**

### Step 2: Set Frontend Environment Variable

1. **Go to Frontend Project on Vercel:**
   - https://vercel.com/dashboard
   - Click your **frontend** project

2. **Add Environment Variable:**
   - Settings → Environment Variables
   - Click "Add New"
   - **Key**: `VITE_API_URL`
   - **Value**: `https://plt-3-dec-backend.vercel.app/api`
     - ⚠️ **Replace with your actual backend Vercel URL**
   - **Environment**: All (Production, Preview, Development)
   - Click "Save"

3. **Redeploy Frontend:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

### Step 3: Find Your URLs

**Backend URL:**
- Go to backend project on Vercel
- Copy the URL from "Domains" section
- Example: `https://plt-3-dec-backend.vercel.app`

**Frontend URL:**
- Go to frontend project on Vercel
- Copy the URL from "Domains" section
- Example: `https://plt-3-dec-frontend.vercel.app`

### Step 4: Commit and Push Backend Changes

The CORS fix I made needs to be deployed:

```bash
git add backend/src/server.ts
git commit -m "Fix CORS to allow multiple origins including Vercel"
git push
```

This will trigger a backend redeploy automatically.

## Quick Checklist

- [ ] Set `CORS_ORIGIN` in backend Vercel project (with your frontend URL)
- [ ] Set `VITE_API_URL` in frontend Vercel project (with your backend URL + /api)
- [ ] Commit and push backend CORS changes
- [ ] Redeploy backend (or wait for auto-deploy)
- [ ] Redeploy frontend (or wait for auto-deploy)
- [ ] Test login with: `admin@ikf.com` / `password123`

## Alternative: Allow All Origins (Quick Test Only)

If you want to test quickly, you can temporarily allow all origins in backend:

**Backend Environment Variable:**
- **Key**: `CORS_ORIGIN`
- **Value**: `*`

⚠️ **Warning**: This is NOT secure for production! Only use for testing.

After testing, use specific URLs as described above.

