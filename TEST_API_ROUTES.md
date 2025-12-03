# Testing API Routes on Vercel

## ✅ Health Check Working!

`/health` is working: `{"status":"ok","timestamp":"2025-12-03T11:38:14.232Z"}`

This confirms:
- ✅ Express app is running
- ✅ Serverless function is working
- ✅ Routes are accessible

## ❌ Login Route Issue

`/api/auth/login` is returning 404. The route is defined as **POST only**, so:

1. **Browser GET requests won't work** - The login route only accepts POST
2. **You need to test with a POST request** - Use a tool like Postman, curl, or the frontend

## How to Test the Login Route

### Option 1: Use curl (Command Line)
```bash
curl -X POST https://plt-3-dec-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ikf.com","password":"password123"}'
```

### Option 2: Use Postman
- Method: **POST**
- URL: `https://plt-3-dec-backend.vercel.app/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "admin@ikf.com",
  "password": "password123"
}
```

### Option 3: Test from Frontend
The frontend should work correctly since it sends POST requests.

## Routes That Work with GET

These routes should work in a browser:

- ✅ `/health` - Already working!
- ❌ `/api/auth/login` - POST only (needs POST request)
- ❌ `/api/auth/register` - POST only
- ✅ `/api/auth/me` - GET route (but needs authentication token)

## Next Steps

The backend is working correctly! The 404 you're seeing is because:
- Login route requires **POST** method
- Browser navigation uses **GET** method

Test with a proper POST request or use the frontend application.

