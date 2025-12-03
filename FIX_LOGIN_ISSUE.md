# 🔧 Fix Login Issue - Connect Frontend to Backend

## Problem
The frontend is trying to connect to `localhost:5000` instead of your deployed backend on Vercel.

## Solution

You need to add the `VITE_API_URL` environment variable in your Vercel frontend project.

### Steps:

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Click on your **frontend project** (`plt-3-dec-frontend`)

2. **Navigate to Settings**
   - Click on **"Settings"** tab (top navigation)
   - Click on **"Environment Variables"** (left sidebar)

3. **Add Environment Variable**
   - Click **"Add New"**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://plt-3-dec-backend.vercel.app/api`
     - ⚠️ **Replace with your actual backend URL if different**
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Redeploy**
   - After saving, go to **"Deployments"** tab
   - Click the **"..."** (three dots) on the latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger automatic redeploy

5. **Wait for Deployment**
   - Wait 2-3 minutes for the build to complete
   - The new deployment will use the updated environment variable

6. **Test Login**
   - Go to your frontend URL
   - Try logging in with:
     - **Email**: `admin@ikf.com` or `superadmin@ikf.com`
     - **Password**: `password123`

## Verify Backend URL

To find your backend URL:
1. Go to https://vercel.com/dashboard
2. Click on your **backend project** (`plt-3-dec-backend`)
3. Copy the URL from the "Domains" section
4. Add `/api` at the end (e.g., `https://plt-3-dec-backend.vercel.app/api`)

## Quick Command (Alternative)

If you prefer using Vercel CLI:

```bash
vercel env add VITE_API_URL production
# When prompted, enter: https://plt-3-dec-backend.vercel.app/api
```

Then redeploy your frontend.

---

**After redeployment, your login should work!** 🎉

