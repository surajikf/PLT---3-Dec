# ⚡ Quick Frontend Deployment Guide

## 🎯 Your Goal
Get a working frontend URL on Vercel: `https://your-frontend.vercel.app`

## 📋 Simple Steps

### 1️⃣ Go to Vercel
**Open**: https://vercel.com/new

### 2️⃣ Create New Project
- Click **"Add New..."** → **"Project"**
- Import your **same Git repository** (yes, same repo as backend!)

### 3️⃣ ⚠️ IMPORTANT: Set Root Directory
- Find **"Root Directory"** 
- Click **"Edit"**
- Type: `frontend`
- Click **"Continue"**

### 4️⃣ Add Environment Variable
Before deploying, add:

**Variable Name**: `VITE_API_URL`
**Variable Value**: `https://plt-3-dec-backend.vercel.app/api`

✅ Check all environments (Production, Preview, Development)

### 5️⃣ Deploy!
- Click **"Deploy"** button
- Wait 2-3 minutes

### 6️⃣ Get Your URL!
After deployment, you'll see:
```
✅ Production: https://your-frontend-name.vercel.app
```

**That's your frontend URL!** 🎉

## 🔧 Update Backend CORS

After getting frontend URL:

1. Go to **Backend Vercel Project**
2. **Settings** → **Environment Variables**
3. Update `CORS_ORIGIN`:
   ```
   https://your-frontend-url.vercel.app
   ```
4. **Redeploy** backend

## ✅ Done!

Now you have:
- **Backend**: `https://plt-3-dec-backend.vercel.app`
- **Frontend**: `https://your-frontend-name.vercel.app`

Both are live! 🚀

