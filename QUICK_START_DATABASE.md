# Quick Start: PostgreSQL Database Setup

## For Windows Users

### Option 1: Automated Setup (Recommended)

1. **Ensure PostgreSQL is installed and running**
   - Download from: https://www.postgresql.org/download/windows/
   - Install and remember your `postgres` user password

2. **Run the setup script:**

Open PowerShell in the `backend` directory:

```powershell
cd backend
.\scripts\setup-database.ps1 -DbPassword "your_postgres_password"
```

This will:
- Create the database
- Set up the schema
- Seed initial data

### Option 2: Manual Setup (Step-by-Step)

#### Step 1: Create Database

Open PowerShell or Command Prompt and run:

```powershell
# Connect to PostgreSQL (enter your password when prompted)
psql -U postgres

# In PostgreSQL prompt, create database:
CREATE DATABASE plt_db;

# Exit PostgreSQL
\q
```

#### Step 2: Create Environment File

Create `backend/.env` file with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/plt_db?schema=public"
JWT_SECRET="change-this-to-a-random-string-minimum-32-characters-long"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**Replace `YOUR_PASSWORD` with your actual PostgreSQL password!**

#### Step 3: Install Dependencies (if not done)

```powershell
cd backend
npm install
```

#### Step 4: Setup Database Schema

```powershell
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed initial data
npx prisma db seed
```

### Option 3: Quick All-in-One Setup

If you already have `.env` configured:

```powershell
cd backend
.\scripts\quick-setup.ps1
```

## For Linux/Mac Users

### Option 1: Automated Setup

```bash
cd backend
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh --db-password "your_postgres_password"
```

### Option 2: Manual Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE plt_db;"

# Create .env file (see Step 2 above)

# Setup schema
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### Option 3: Quick All-in-One Setup

```bash
cd backend
chmod +x scripts/quick-setup.sh
./scripts/quick-setup.sh
```

## Verify Setup

Check if everything works:

```powershell
cd backend
npx prisma studio
```

This opens a browser interface where you can see all your database tables and data.

## Default Login Credentials

After seeding, you can login with:

- **Super Admin**: `superadmin@ikf.com` / `password123`
- **Admin**: `admin@ikf.com` / `password123`
- **Project Manager**: `pm@ikf.com` / `password123`
- **Team Member**: `team@ikf.com` / `password123`
- **Client**: `client@example.com` / `password123`

## Troubleshooting

### PostgreSQL not found

**Error:** `'psql' is not recognized as an internal or external command`

**Solution:**
1. Add PostgreSQL bin directory to PATH:
   - Usually: `C:\Program Files\PostgreSQL\XX\bin`
   - Add to System Environment Variables → Path

### Connection Refused

**Error:** `could not connect to server`

**Solution:**
1. Check if PostgreSQL service is running:
   - Open Services app (Win+R → `services.msc`)
   - Find "PostgreSQL" service
   - Start it if stopped

### Wrong Password

**Error:** `password authentication failed`

**Solution:**
1. Check your PostgreSQL password
2. Update `DATABASE_URL` in `backend/.env`
3. Try resetting password:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Database Already Exists

**Error:** `database "plt_db" already exists`

**Solution:**
- Use existing database (recommended)
- OR drop and recreate:
  ```sql
  DROP DATABASE plt_db;
  CREATE DATABASE plt_db;
  ```

## Need More Help?

See detailed guide: `DATABASE_SETUP.md`

