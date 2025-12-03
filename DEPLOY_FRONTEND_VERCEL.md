# 🚀 Deploy Frontend to Vercel - Step by Step

## Quick Deployment Steps

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository (same repo as backend)
4. When asked about **Root Directory**, select: `frontend`

### Step 2: Configure Project Settings

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `dist` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

### Step 3: Add Environment Variable

Before deploying, add this environment variable:

1. In the project settings, go to **Environment Variables**
2. Click **Add New**
3. Add:
   ```
   Name: VITE_API_URL
   Value: https://your-backend-app.vercel.app/api
   ```
   Replace `your-backend-app.vercel.app` with your actual backend Vercel URL

4. Select all environments: **Production**, **Preview**, **Development**
5. Click **Save**

### Step 4: Deploy

Click **"Deploy"** button - Vercel will:
- Install dependencies
- Build the React app
- Deploy it to a unique URL

### Step 5: Update Backend CORS

After frontend is deployed, update your backend's `CORS_ORIGIN`:

1. Go to your **Backend Vercel Project** → **Settings** → **Environment Variables**
2. Update `CORS_ORIGIN` to include your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-app.vercel.app
   ```
   Or for multiple origins:
   ```
   CORS_ORIGIN=https://your-frontend-app.vercel.app,http://localhost:5173
   ```
3. **Redeploy** the backend for changes to take effect

## Your URLs

After deployment:
- **Frontend**: `https://your-frontend-project.vercel.app`
- **Backend**: `https://your-backend-project.vercel.app`

## Troubleshooting

### Frontend can't connect to backend
- ✅ Check `VITE_API_URL` environment variable is set correctly
- ✅ Verify backend URL is accessible (test `/health` endpoint)
- ✅ Check backend `CORS_ORIGIN` includes frontend URL

### Build fails
- ✅ Check build logs in Vercel dashboard
- ✅ Verify `package.json` has correct build script
- ✅ Make sure all dependencies are in `package.json`

### 404 errors on routes
- ✅ `vercel.json` rewrite rule should handle React Router
- ✅ All routes should redirect to `/index.html`

## Files Created

✅ `frontend/vercel.json` - Vercel configuration (already created)

You're ready to deploy! 🎉

