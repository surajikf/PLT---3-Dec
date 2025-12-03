# Frontend Vercel Deployment Guide

## Quick Steps to Deploy Frontend

### 1. Create New Vercel Project for Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. **Root Directory**: Select `frontend`

### 2. Configure Build Settings

In Vercel project settings:

- **Framework Preset**: `Vite` (should auto-detect)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

Replace `your-backend-url.vercel.app` with your actual backend Vercel URL.

### 4. Deploy

Click **"Deploy"** - Vercel will automatically build and deploy your frontend!

## Important Notes

1. **API URL**: Update `VITE_API_URL` to point to your deployed backend
2. **CORS**: Make sure your backend has `CORS_ORIGIN` set to your frontend URL
3. **Environment Variables**: Only variables starting with `VITE_` are exposed to the frontend

## After Deployment

Your frontend will be available at:
`https://your-frontend-project.vercel.app`

Update your backend's `CORS_ORIGIN` environment variable to include this URL!

