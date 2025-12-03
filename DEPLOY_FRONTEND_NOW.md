# 🚀 Frontend Vercel Deployment - Quick Start

## ✅ Configuration Ready!

Files created:
- ✅ `frontend/vercel.json` - Vercel configuration
- ✅ Frontend is ready to deploy!

## 📋 Step-by-Step Deployment

### 1. Go to Vercel Dashboard
**https://vercel.com/new**

### 2. Create New Project
1. **Import Git Repository**: Select your repository
2. **Configure Project**:
   ```
   ⚠️ Root Directory: frontend
   Framework: Vite (auto-detected)
   Build Command: npm run build
   Output Directory: dist
   ```

### 3. Add Environment Variable
**Before clicking Deploy**, add:

```
Variable Name: VITE_API_URL
Value: https://your-backend-url.vercel.app/api
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Vercel.

**Select all environments**: ✅ Production ✅ Preview ✅ Development

### 4. Deploy!
Click **"Deploy"** button

### 5. Get Your Frontend URL
After deployment completes, you'll see:
```
✅ Production: https://your-frontend-project.vercel.app
```

### 6. Update Backend CORS (Important!)
Once frontend is deployed:

1. Go to **Backend Vercel Project** → **Settings** → **Environment Variables**
2. Update `CORS_ORIGIN`:
   ```
   https://your-frontend-project.vercel.app
   ```
3. **Redeploy** backend

## 🎯 Your Final URLs

- **Frontend**: `https://your-frontend-project.vercel.app`
- **Backend**: `https://your-backend-project.vercel.app`

## ⚠️ Critical Points

1. **Root Directory MUST be `frontend`** - Very important!
2. **Environment Variable** - Set `VITE_API_URL` before deploying
3. **CORS Update** - Update backend CORS after frontend deployment

## 🔍 Finding Your Backend URL

1. Go to your backend Vercel project
2. Copy the URL from the deployments page
3. Example: `https://plt-3-dec-backend.vercel.app`
4. Use: `https://plt-3-dec-backend.vercel.app/api` for `VITE_API_URL`

## ✅ Checklist

- [ ] Created new Vercel project
- [ ] Set Root Directory to `frontend`
- [ ] Added `VITE_API_URL` environment variable
- [ ] Deployed successfully
- [ ] Copied frontend URL
- [ ] Updated backend `CORS_ORIGIN` with frontend URL
- [ ] Tested frontend connection to backend

**Ready to deploy! Follow the steps above.** 🚀

