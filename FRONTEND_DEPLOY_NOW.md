# 🚀 Get Your Frontend URL - Simple Steps

## Your Backend URL
**Backend**: `https://plt-3-dec-backend.vercel.app` ✅

## Now Deploy Frontend - Follow These Steps:

### Step 1: Go to Vercel
👉 **Open this link**: https://vercel.com/new

### Step 2: Create New Project
1. Click **"Add New..."** button (top right)
2. Click **"Project"**
3. **Select your Git repository** (same one you used for backend)

### Step 3: Configure Project

**⚠️ VERY IMPORTANT - Set Root Directory:**

1. Look for **"Root Directory"** section
2. You'll see it says something like "No root directory" or shows "/"
3. Click **"Edit"** or **"Configure"**
4. Type: `frontend`
5. Click **"Continue"** or **"Save"**

### Step 4: Add Environment Variable

**Before clicking Deploy**, scroll down to find **"Environment Variables"**

1. Click **"Add"** or **"Add New"**
2. Add this variable:

   **Name**: `VITE_API_URL`
   
   **Value**: `https://plt-3-dec-backend.vercel.app/api`

3. Check all boxes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

4. Click **"Save"**

### Step 5: Deploy!

1. Scroll down
2. Click the big **"Deploy"** button
3. Wait 2-3 minutes (you'll see build progress)

### Step 6: Get Your Frontend URL! 🎉

After deployment finishes, you'll see:

```
✅ Production
https://your-frontend-name.vercel.app
```

**That's your frontend URL! Copy it!**

### Step 7: Update Backend CORS

After you have your frontend URL:

1. Go to your **Backend Vercel Project** (the one you already have)
2. Click **"Settings"** (top tab)
3. Click **"Environment Variables"** (left menu)
4. Find `CORS_ORIGIN`
5. Click **"Edit"** or add new value:
   ```
   https://your-frontend-url.vercel.app
   ```
   (Replace with your actual frontend URL)
6. Click **"Save"**
7. Go to **"Deployments"** tab
8. Click **"Redeploy"** on latest deployment

## ✅ Done!

You now have:
- **Backend**: `https://plt-3-dec-backend.vercel.app` ✅
- **Frontend**: `https://your-frontend-name.vercel.app` ✅

## 📝 Quick Checklist

- [ ] Opened https://vercel.com/new
- [ ] Created new project with same repository
- [ ] Set Root Directory to `frontend`
- [ ] Added `VITE_API_URL` = `https://plt-3-dec-backend.vercel.app/api`
- [ ] Clicked Deploy
- [ ] Got frontend URL
- [ ] Updated backend CORS with frontend URL
- [ ] Tested frontend!

**That's it! Your frontend will be live!** 🎉

