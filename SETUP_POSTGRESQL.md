# Step-by-Step PostgreSQL Database Setup

## 🎯 Goal
Set up PostgreSQL database for IKF Project Livetracker application.

## 📋 Prerequisites Checklist

- [ ] PostgreSQL installed on your system
- [ ] PostgreSQL service is running
- [ ] You know your PostgreSQL `postgres` user password
- [ ] Node.js and npm installed

## 🚀 Step-by-Step Instructions

### Step 1: Verify PostgreSQL Installation

Open PowerShell or Command Prompt and check:

```powershell
psql --version
```

If you see a version number (e.g., `psql (PostgreSQL) 14.9`), you're good!

**If not installed:**
- Download from: https://www.postgresql.org/download/windows/
- Install PostgreSQL (remember the password you set!)

### Step 2: Check PostgreSQL Service

**Option A: Via Services**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Look for "postgresql-x64-XX" service
4. If it's not running, right-click → Start

**Option B: Via PowerShell**
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

### Step 3: Create the Database

Open PowerShell and run:

```powershell
# Connect to PostgreSQL (will prompt for password)
psql -U postgres

# Once connected, you'll see: postgres=#
# Now create the database:
CREATE DATABASE plt_db;

# Verify it was created:
\l

# You should see plt_db in the list
# Exit PostgreSQL:
\q
```

**Alternative: Create database directly:**
```powershell
# Single command (will prompt for password)
psql -U postgres -c "CREATE DATABASE plt_db;"
```

### Step 4: Create Environment File

Navigate to the `backend` folder and create `.env` file:

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
```

Create a new file named `.env` with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/plt_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-in-production"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**⚠️ IMPORTANT:** Replace `YOUR_PASSWORD_HERE` with your actual PostgreSQL password!

### Step 5: Install Backend Dependencies

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
npm install
```

Wait for installation to complete.

### Step 6: Generate Prisma Client

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
npx prisma generate
```

This creates the database client code.

### Step 7: Create Database Tables (Migrations)

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
npx prisma migrate dev --name init
```

This will:
- Create all tables, indexes, and relationships
- Ask if you want to create a new migration (type `Y` and press Enter)

### Step 8: Seed Initial Data

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
npx prisma db seed
```

This populates the database with:
- Default users (5 roles)
- Sample department
- Default stages
- Sample customer

You should see:
```
✅ Seeding completed!
📋 Default Users Created:
Super Admin: superadmin@ikf.com / password123
...
```

### Step 9: Verify Setup

Open Prisma Studio to view your database:

```powershell
cd "E:\Cursor\PLT - 3 Dec\backend"
npx prisma studio
```

This opens a browser at `http://localhost:5555` where you can:
- View all tables
- See the seeded data
- Verify everything is set up correctly

## ✅ Verification Checklist

- [ ] Database `plt_db` exists
- [ ] All tables are created (User, Project, Timesheet, etc.)
- [ ] Seed data is present (users, departments, stages)
- [ ] Can access Prisma Studio
- [ ] Backend can start without database errors

## 🎉 Success!

Your database is now set up! You can now:

1. Start the backend server:
   ```powershell
   cd "E:\Cursor\PLT - 3 Dec"
   npm run dev:backend
   ```

2. Test the login with:
   - Email: `superadmin@ikf.com`
   - Password: `password123`

## 🔧 Troubleshooting

### Problem: "psql is not recognized"

**Solution:**
1. Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\XX\bin`)
2. Add to System PATH:
   - Right-click "This PC" → Properties
   - Advanced System Settings → Environment Variables
   - Edit "Path" → Add PostgreSQL bin folder
   - Restart terminal

### Problem: "Connection refused" or "could not connect"

**Solution:**
1. Check if PostgreSQL service is running (Step 2)
2. Verify port 5432 is not blocked by firewall
3. Check PostgreSQL is listening:
   ```powershell
   netstat -an | findstr 5432
   ```

### Problem: "password authentication failed"

**Solution:**
1. Verify password in `.env` matches your PostgreSQL password
2. Try resetting password:
   ```powershell
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';
   ```
3. Update `.env` with new password

### Problem: "database plt_db already exists"

**Solution:**
- This is okay! Database already exists
- Skip Step 3 and continue from Step 4

### Problem: Migration fails

**Solution:**
1. Reset and try again (⚠️ deletes data):
   ```powershell
   npx prisma migrate reset
   npx prisma migrate dev --name init
   ```
2. Or manually check for errors in the migration

## 📚 Additional Resources

- Full setup guide: `DATABASE_SETUP.md`
- Quick start: `QUICK_START_DATABASE.md`
- Main README: `README.md`

## 💡 Tips

1. **Keep your `.env` file secure** - Never commit it to git
2. **Change default passwords** in production
3. **Backup your database** regularly:
   ```powershell
   pg_dump -U postgres plt_db > backup.sql
   ```
4. **Use Prisma Studio** to explore and manage data visually

---

**Need help?** Check the troubleshooting section or refer to the detailed guides!

