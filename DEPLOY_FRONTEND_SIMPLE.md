# 🚀 Deploy Frontend to Vercel - Simple Steps

## Step-by-Step Guide

### Step 1: Go to Vercel Dashboard
Open: **https://vercel.com/new**

### Step 2: Create New Project
1. Click **"Add New..."** → **"Project"**
2. **Import your Git repository** (same repo as backend)

### Step 3: Configure Project Settings

**⚠️ IMPORTANT - Set Root Directory:**

1. Look for **"Root Directory"** section
2. Click **"Edit"** or **"Configure"**
3. Select: **`frontend`** folder
4. Click **"Continue"**

### Step 4: Build Settings (Auto-detected)
Vercel should auto-detect these, but verify:

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 5: Add Environment Variable

**BEFORE clicking Deploy**, add environment variable:

1. Find **"Environment Variables"** section
2. Click **"Add"**
3. Add this:

   **Name**: `VITE_API_URL`
   
   **Value**: `https://plt-3-dec-backend.vercel.app/api`
   
   (Use your actual backend URL)

4. Select all environments: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

### Step 6: Deploy!
Click the **"Deploy"** button

### Step 7: Wait for Deployment
- Wait 1-2 minutes for build to complete
- You'll see build progress

### Step 8: Get Your Frontend URL
After deployment completes, you'll see:

**✅ Production URL**: `https://your-frontend-project.vercel.app`

**This is your frontend URL!** 🎉

## After Deployment

1. **Copy your frontend URL** (e.g., `https://plt-3-dec-frontend.vercel.app`)

2. **Update Backend CORS** (if not already done):
   - Go to Backend Vercel Project
   - Settings → Environment Variables
   - Update `CORS_ORIGIN` to include your frontend URL:
     ```
     https://your-frontend-url.vercel.app
     ```
   - Redeploy backend

3. **Test your frontend**:
   - Open the frontend URL in browser
   - Try logging in

## That's It! 🚀

Your frontend will be live at: `https://your-frontend-project.vercel.app`

