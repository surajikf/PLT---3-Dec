# 📝 Vercel Environment Variable Setup

## Frontend Environment Variables

Add this environment variable to your **frontend** Vercel project:

```
VITE_API_URL=https://plt-3-dec-backend.vercel.app/api
```

### How to Add:

1. **Vercel Dashboard** → Your Frontend Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Enter:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://plt-3-dec-backend.vercel.app/api` (replace with your actual backend URL)
   - **Environment**: All (Production, Preview, Development)
4. Click **"Save"**
5. **Redeploy** your frontend project

## Backend Environment Variables

Make sure your **backend** has these environment variables:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## Important Notes

- ⚠️ Replace `plt-3-dec-backend.vercel.app` with your actual backend Vercel URL
- ⚠️ Replace `your-frontend-url.vercel.app` with your actual frontend Vercel URL
- Environment variables starting with `VITE_` are exposed to the browser
- After adding environment variables, you **must redeploy** for changes to take effect

