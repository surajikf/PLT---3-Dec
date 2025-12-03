# Vercel Deployment Configuration - Complete Guide

## ✅ Files Created/Updated

1. `backend/vercel.json` - Vercel configuration
2. `backend/api/server.ts` - Serverless function entry point
3. `backend/package.json` - Added `vercel-build` script
4. `backend/src/server.ts` - Updated for serverless compatibility

## Vercel Dashboard Settings

Go to: **https://vercel.com/surajs-projects-05327f65/plt-3-dec-backend**

### Required Configuration:

#### 1. General Settings
- **Framework Preset**: Other
- **Root Directory**: `backend`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: Leave empty (handled by vercel.json)
- **Install Command**: `npm install`

#### 2. Environment Variables
Go to Settings → Environment Variables and add:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
PORT=5000
```

#### 3. Node.js Version
- Settings → Node.js Version: `20.x`

## Build Process

Vercel will:
1. Install dependencies (`npm install`)
2. Run `vercel-build` which:
   - Generates Prisma Client (`prisma generate`)
   - Compiles TypeScript (`tsc`)
3. Deploy serverless functions

## API Endpoints

After deployment, your API will be available at:
- Base URL: `https://your-app.vercel.app`
- Health: `https://your-app.vercel.app/health`
- Auth: `https://your-app.vercel.app/api/auth/login`
- Projects: `https://your-app.vercel.app/api/projects`
- etc.

## Troubleshooting

If build fails:
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Check that DATABASE_URL is correct
4. Ensure Prisma Client generates successfully

## Next Steps

1. **Update Vercel Settings** (in dashboard)
2. **Add Environment Variables**
3. **Commit and push changes**
4. **Trigger new deployment**

Ready to deploy! 🚀

