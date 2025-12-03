# PostgreSQL Database Setup Guide

This guide will help you set up the PostgreSQL database for the IKF Project Livetracker application.

## Prerequisites

1. **PostgreSQL installed** on your system
   - Download from: https://www.postgresql.org/download/
   - Version 14 or higher recommended

2. **PostgreSQL service running**
   - Windows: Check Services app or run `pg_ctl status`
   - Linux/Mac: `sudo systemctl status postgresql` or `brew services list`

## Quick Setup (Automated)

### Windows (PowerShell)

```powershell
cd backend
.\scripts\setup-database.ps1 -DbPassword "your_postgres_password"
```

### Linux/Mac (Bash)

```bash
cd backend
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh --db-password "your_postgres_password"
```

## Manual Setup

### Step 1: Install PostgreSQL

#### Windows
1. Download installer from https://www.postgresql.org/download/windows/
2. Run installer and follow prompts
3. Remember the password you set for the `postgres` superuser
4. Add PostgreSQL bin directory to PATH (usually `C:\Program Files\PostgreSQL\XX\bin`)

#### macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Access PostgreSQL

Open a terminal/command prompt and connect to PostgreSQL:

```bash
# Default connection (as postgres user)
psql -U postgres

# If prompted for password, enter your PostgreSQL superuser password
```

### Step 3: Create Database

Once connected to PostgreSQL, run:

```sql
CREATE DATABASE plt_db;
```

Verify it was created:

```sql
\l
```

You should see `plt_db` in the list.

Exit PostgreSQL:

```sql
\q
```

### Step 4: Configure Environment Variables

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/plt_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

**⚠️ Important:** Replace:
- `your_password` with your actual PostgreSQL password
- `your-super-secret-jwt-key-change-in-production-min-32-chars` with a strong random string

### Step 5: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This creates the Prisma Client based on your schema.

### Step 6: Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create all tables, indexes, and relationships
- Create a migration history

### Step 7: Seed the Database

```bash
cd backend
npx prisma db seed
```

This will populate the database with:
- Default users (Super Admin, Admin, PM, Team Member, Client)
- Sample department
- Default stages (Planning, Design, Development, Testing, Deployment)
- Sample customer

**Default login credentials after seeding:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@ikf.com | password123 |
| Admin | admin@ikf.com | password123 |
| Project Manager | pm@ikf.com | password123 |
| Team Member | team@ikf.com | password123 |
| Client | client@example.com | password123 |

**⚠️ Change these passwords in production!**

## Verification

Verify the setup:

```bash
cd backend
npx prisma studio
```

This opens Prisma Studio in your browser where you can:
- View all tables
- Browse data
- Verify seed data was created

## Troubleshooting

### Connection Refused

**Error:** `could not connect to server: Connection refused`

**Solutions:**
1. Check if PostgreSQL service is running
   - Windows: Services app → PostgreSQL
   - Linux: `sudo systemctl start postgresql`
   - Mac: `brew services start postgresql@14`
2. Verify PostgreSQL is listening on port 5432
3. Check firewall settings

### Authentication Failed

**Error:** `password authentication failed for user "postgres"`

**Solutions:**
1. Verify password in `DATABASE_URL` matches PostgreSQL password
2. Check `pg_hba.conf` authentication settings
3. Try resetting PostgreSQL password:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Database Already Exists

**Error:** `database "plt_db" already exists`

**Solutions:**
1. Use existing database (recommended for development)
2. Drop and recreate:
   ```sql
   DROP DATABASE plt_db;
   CREATE DATABASE plt_db;
   ```

### Permission Denied

**Error:** `permission denied to create database`

**Solutions:**
1. Connect as superuser (`postgres`)
2. Grant permissions:
   ```sql
   ALTER USER your_user WITH CREATEDB;
   ```

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solutions:**
```bash
cd backend
npx prisma generate
```

### Migration Errors

**Error:** Migration fails or tables already exist

**Solutions:**
1. Reset database (⚠️ This deletes all data):
   ```bash
   cd backend
   npx prisma migrate reset
   ```
2. Create new migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

## Production Setup

For production, consider:

1. **Create dedicated database user:**
   ```sql
   CREATE USER plt_user WITH PASSWORD 'strong_password_here';
   GRANT ALL PRIVILEGES ON DATABASE plt_db TO plt_user;
   \c plt_db
   GRANT ALL ON SCHEMA public TO plt_user;
   ```

2. **Update DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://plt_user:strong_password@localhost:5432/plt_db?schema=public"
   ```

3. **Enable SSL** (if required):
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/plt_db?schema=public&sslmode=require"
   ```

4. **Set up regular backups:**
   ```bash
   pg_dump -U plt_user plt_db > backup_$(date +%Y%m%d).sql
   ```

5. **Use connection pooling** (e.g., PgBouncer) for better performance

## Useful Commands

```bash
# Connect to database
psql -U postgres -d plt_db

# List all databases
psql -U postgres -l

# View all tables
psql -U postgres -d plt_db -c "\dt"

# View table structure
psql -U postgres -d plt_db -c "\d table_name"

# Run SQL file
psql -U postgres -d plt_db -f script.sql

# Backup database
pg_dump -U postgres plt_db > backup.sql

# Restore database
psql -U postgres plt_db < backup.sql

# Reset Prisma migrations
cd backend
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy
```

## Next Steps

After database setup:

1. ✅ Verify database connection in `backend/.env`
2. ✅ Run Prisma migrations
3. ✅ Seed initial data
4. ✅ Start backend server: `npm run dev:backend`
5. ✅ Start frontend: `npm run dev:frontend`

## Need Help?

- Check PostgreSQL logs for detailed error messages
- Verify environment variables are set correctly
- Ensure PostgreSQL service is running
- Check network/firewall settings
- Review Prisma migration history

For more help, refer to:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)

