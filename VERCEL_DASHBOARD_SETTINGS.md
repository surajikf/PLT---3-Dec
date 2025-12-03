# Vercel Dashboard Configuration - Step by Step

## Project URL
**https://vercel.com/surajs-projects-05327f65/plt-3-dec-backend**

## Step-by-Step Configuration

### Step 1: Root Directory
1. Go to **Settings** → **General**
2. Find **Root Directory**
3. Set to: `backend`
4. Click **Save**

### Step 2: Build & Development Settings
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Configure:
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Save**

### Step 3: Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add each variable:

```
Name: DATABASE_URL
Value: your_postgresql_connection_string
Environment: Production, Preview, Development
```

```
Name: JWT_SECRET
Value: your_secure_random_secret_key_minimum_32_characters
Environment: Production, Preview, Development
```

```
Name: JWT_EXPIRE
Value: 7d
Environment: Production, Preview, Development
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

```
Name: CORS_ORIGIN
Value: https://your-frontend-url.vercel.app
Environment: Production, Preview, Development
```

```
Name: PORT
Value: 5000
Environment: Production, Preview, Development (optional)
```

### Step 4: Node.js Version
1. Go to **Settings** → **General**
2. Find **Node.js Version**
3. Select: `20.x`
4. Click **Save**

### Step 5: Trigger Deployment
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Files Ready for Deployment

✅ All files are configured correctly:
- `backend/vercel.json` - Vercel config
- `backend/api/index.ts` - Serverless entry point
- `backend/package.json` - Build scripts ready
- All TypeScript errors fixed

## Expected Build Log

You should see:
```
✓ Installing dependencies
✓ Running "npm run vercel-build"
  → prisma generate
  → tsc
✓ Build completed
✓ Deploying...
```

## After Deployment

Test your API:
- Health: `https://your-app.vercel.app/health`
- Login: `https://your-app.vercel.app/api/auth/login`

All configuration files are ready! Just update the dashboard settings! 🚀

