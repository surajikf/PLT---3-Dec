# Fix for 500 Internal Server Error

## Problem
The API is returning 500 errors because the database schema doesn't match the Prisma schema. New fields and relations were added but migrations haven't been run.

## Solution

**IMPORTANT: Stop the backend server first!**

1. **Stop the backend server** (Ctrl+C in the terminal where it's running)

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Create and apply migration:**
   ```bash
   npx prisma migrate dev --name add_enhancements
   ```

5. **Restart the backend server:**
   ```bash
   npm run dev
   ```

## What This Does

- Adds `taskId` column to `Timesheet` table
- Adds `estimatedHours` and `actualHours` to `Task` table  
- Creates new tables: `TaskDependency`, `ProjectTemplate`, `ResourceCapacity`, `ApprovalChain`, `ApprovalRequest`
- Updates `User` table with new foreign key relations

## If You Get File Lock Errors

If you see "EPERM: operation not permitted" errors:
1. Make sure the backend server is completely stopped
2. Close any Prisma Studio windows
3. Wait a few seconds
4. Try again

## Alternative: Quick Fix (Temporary)

If you can't run migrations right now, you can temporarily comment out the `task` relation in queries, but this is NOT recommended for production.

