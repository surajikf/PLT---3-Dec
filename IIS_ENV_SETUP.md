# IIS Environment Variables Setup

## Backend .env File

Create `C:\inetpub\wwwroot\plt-api\.env` with the following content:

```env
# Database
DATABASE_URL="mysql://dbo_projectlivetracker:cwF%21ebdaKf32%40%23@192.168.2.100:3306/db_projectlivetracker"

# JWT - CHANGE THIS TO A STRONG RANDOM STRING IN PRODUCTION!
JWT_SECRET="your-production-jwt-secret-minimum-32-characters-long-change-this-to-something-secure"
JWT_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV=production

# CORS - Update with your actual server IP/domain
# For multiple origins, separate with commas: "http://192.168.2.100,http://yourdomain.com"
CORS_ORIGIN="http://192.168.2.100,http://your-domain.com"
```

**Important Notes:**
- Replace `JWT_SECRET` with a strong random string (minimum 32 characters)
- Update `CORS_ORIGIN` with your actual server IP address and/or domain name
- The password in `DATABASE_URL` is URL-encoded (`!` = `%21`, `@` = `%40`, `#` = `%23`)

## Frontend .env.production File

Before building the frontend, create `frontend\.env.production`:

```env
# API URL - Update with your actual server IP/domain
# If backend is at http://192.168.2.100/plt-api, use:
VITE_API_URL=http://192.168.2.100/plt-api/api

# Or if using a domain:
# VITE_API_URL=http://your-domain.com/plt-api/api

# Or if using HTTPS:
# VITE_API_URL=https://your-domain.com/plt-api/api
```

**Important Notes:**
- This file must be created BEFORE running `npm run build`
- The API URL should match your IIS application path (`/plt-api/api`)
- If you change this after building, you need to rebuild the frontend

## Quick Setup Commands

### On Development Machine (before deployment):

```powershell
# 1. Create frontend .env.production
cd frontend
@"
VITE_API_URL=http://192.168.2.100/plt-api/api
"@ | Out-File -FilePath .env.production -Encoding utf8

# 2. Build frontend
npm run build

# 3. Build backend
cd ../backend
npm run build
npx prisma generate
```

### On Windows Server (after deployment):

```powershell
# Create backend .env file
cd C:\inetpub\wwwroot\plt-api
@"
DATABASE_URL="mysql://dbo_projectlivetracker:cwF%21ebdaKf32%40%23@192.168.2.100:3306/db_projectlivetracker"
JWT_SECRET="your-production-jwt-secret-minimum-32-characters-long-change-this"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="http://192.168.2.100"
"@ | Out-File -FilePath .env -Encoding utf8
```

## Testing Environment Variables

### Test Backend Connection:
```powershell
# Navigate to backend directory
cd C:\inetpub\wwwroot\plt-api

# Test database connection
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(e => console.error(e)).finally(() => prisma.\$disconnect());"
```

### Verify Environment Variables:
```powershell
# Check if .env is loaded
cd C:\inetpub\wwwroot\plt-api
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');"
```

