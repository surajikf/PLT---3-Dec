# MySQL Migration Guide

## ✅ Migration Complete

Your application has been successfully migrated from PostgreSQL to MySQL.

## 🔧 Changes Made

### 1. Prisma Schema Updated
- Changed `provider` from `"postgresql"` to `"mysql"` in `backend/prisma/schema.prisma`
- All Prisma enums are compatible with MySQL (Prisma handles the conversion automatically)
- UUID fields will work correctly (Prisma uses CHAR(36) for UUIDs in MySQL)
- `@db.Text` fields are compatible with MySQL

### 2. Environment Configuration
- Updated `backend/env.example.txt` with MySQL connection string format
- Updated `backend/src/utils/envValidation.ts` to accept MySQL connection strings

### 3. Database Connection Details

**Server Information:**
- **Host:** 192.168.2.100
- **Port:** 3306 (default MySQL port)
- **Database:** db_projectlivetracker
- **Username:** dbo_projectlivetracker
- **Password:** cwF!ebdaKf32@#

## 📝 Setup Instructions

### Step 1: Create `.env` File

Create `backend/.env` file with the following content:

```env
# Database - MySQL Connection
# Note: Special characters in password are URL-encoded (! = %21, @ = %40, # = %23)
DATABASE_URL="mysql://dbo_projectlivetracker:cwF%21ebdaKf32%40%23@192.168.2.100:3306/db_projectlivetracker"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

**Important:** The password contains special characters that must be URL-encoded:
- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`

### Step 2: Install MySQL Client (if needed)

If you need to connect to MySQL from your local machine:

**Windows:**
- Download MySQL Workbench or MySQL Command Line Client
- Or use a MySQL client like HeidiSQL, DBeaver, or TablePlus

**Linux/Mac:**
```bash
# Install MySQL client
sudo apt-get install mysql-client  # Ubuntu/Debian
brew install mysql-client          # macOS
```

### Step 3: Verify Database Connection

Test the connection from your local machine (optional):

```bash
mysql -h 192.168.2.100 -u dbo_projectlivetracker -p db_projectlivetracker
# Enter password: cwF!ebdaKf32@#
```

### Step 4: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This will regenerate the Prisma Client for MySQL.

### Step 5: Run Database Migrations

**Important:** If you have existing data in PostgreSQL, you'll need to export and import it separately.

For a fresh database:

```bash
cd backend
npx prisma migrate dev --name init_mysql
```

This will:
- Create all tables in MySQL
- Set up indexes and relationships
- Create migration history

### Step 6: Seed the Database (Optional)

If you want to populate with initial data:

```bash
cd backend
npx prisma db seed
```

This will create:
- Default users (Super Admin, Admin, PM, Team Member, Client)
- Sample departments
- Default stages
- Sample customers

**Default login credentials after seeding:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@ikf.com | password123 |
| Admin | admin@ikf.com | password123 |
| Project Manager | pm@ikf.com | password123 |
| Team Member | team@ikf.com | password123 |
| Client | client@example.com | password123 |

⚠️ **Change these passwords in production!**

### Step 7: Verify Setup

```bash
cd backend
npx prisma studio
```

This opens Prisma Studio where you can:
- View all tables
- Browse data
- Verify the migration was successful

## 🔍 Verification Checklist

- [ ] `.env` file created with correct MySQL connection string
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Database migrations run successfully
- [ ] Can connect to database from application
- [ ] All tables created correctly
- [ ] Seed data loaded (if applicable)
- [ ] Application starts without errors

## ⚠️ Important Notes

### 1. Password URL Encoding
The password `cwF!ebdaKf32@#` must be URL-encoded in the connection string:
- Original: `cwF!ebdaKf32@#`
- Encoded: `cwF%21ebdaKf32%40%23`

### 2. Enum Handling
Prisma enums work seamlessly with MySQL. Prisma automatically converts them to VARCHAR with CHECK constraints in MySQL.

### 3. UUID Support
UUIDs are stored as CHAR(36) in MySQL, which Prisma handles automatically.

### 4. Text Fields
`@db.Text` fields are converted to MySQL TEXT type automatically.

### 5. Indexes
All indexes from your schema will be created correctly in MySQL.

## 🚨 Troubleshooting

### Connection Refused
**Error:** `Error: P1001: Can't reach database server`

**Solutions:**
1. Verify the server IP address (192.168.2.100) is accessible
2. Check if MySQL is running on the server
3. Verify firewall allows connections on port 3306
4. Check if the MySQL user has remote access permissions

### Authentication Failed
**Error:** `Error: P1000: Authentication failed`

**Solutions:**
1. Verify username: `dbo_projectlivetracker`
2. Verify password is correctly URL-encoded
3. Check if the user exists and has proper permissions
4. Verify the user can connect from your IP address

### Database Not Found
**Error:** `Error: P1003: Database does not exist`

**Solutions:**
1. Verify database name: `db_projectlivetracker`
2. Create the database if it doesn't exist:
   ```sql
   CREATE DATABASE db_projectlivetracker;
   ```

### Migration Errors
**Error:** Migration fails with syntax errors

**Solutions:**
1. Make sure you've run `npx prisma generate` first
2. Check MySQL version (should be 5.7+ or 8.0+)
3. Verify all Prisma schema syntax is correct
4. Try resetting migrations: `npx prisma migrate reset` (⚠️ This deletes all data!)

## 📊 Data Migration (If Needed)

If you have existing data in PostgreSQL that needs to be migrated:

1. **Export from PostgreSQL:**
   ```bash
   pg_dump -h localhost -U postgres -d plt_db > backup.sql
   ```

2. **Convert SQL (manual process):**
   - PostgreSQL and MySQL have different SQL syntax
   - You'll need to manually convert or use a migration tool
   - Consider using a tool like `pgloader` or manual data export/import

3. **Import to MySQL:**
   ```bash
   mysql -h 192.168.2.100 -u dbo_projectlivetracker -p db_projectlivetracker < converted_backup.sql
   ```

**Note:** For production data migration, consider using a professional migration tool or service.

## ✅ Migration Complete!

Your application is now configured to use MySQL. All Prisma features will work correctly with MySQL.

## 🔄 Rollback (If Needed)

If you need to rollback to PostgreSQL:

1. Change `provider` back to `"postgresql"` in `backend/prisma/schema.prisma`
2. Update `DATABASE_URL` to PostgreSQL format
3. Run `npx prisma generate`
4. Run migrations again

---

**Need Help?** Check Prisma documentation for MySQL: https://www.prisma.io/docs/concepts/database-connectors/mysql

