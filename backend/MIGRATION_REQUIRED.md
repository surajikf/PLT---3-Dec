# Database Migration Required

The schema has been updated with new features. You need to run migrations.

## Steps to Fix:

1. **Stop the backend server** (if running)

2. **Generate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Create and run migration:**
   ```bash
   npx prisma migrate dev --name add_enhancements
   ```

4. **Restart the backend server**

## What Changed:

- Added `taskId` field to `Timesheet` model
- Added `estimatedHours` and `actualHours` to `Task` model
- Added new models: `TaskDependency`, `ProjectTemplate`, `ResourceCapacity`, `ApprovalChain`, `ApprovalRequest`
- Added new relations to `User` model

If you get file lock errors, make sure the server is completely stopped before running migrations.


