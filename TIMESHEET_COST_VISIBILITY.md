# ✅ Cost Column Visibility - Role-Based Access

## What Was Changed

### ✅ Cost Column Now Hidden for Unauthorized Users

The **Cost** column in the timesheet table is now only visible to:
- ✅ **Super Admin**
- ✅ **Admin**  
- ✅ **Project Manager**

All other users (Team Members, Clients) will **not see the Cost column**.

## Implementation Details

### Role Check
Uses the existing `canApprove` variable which checks:
```typescript
const canApprove = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role as UserRole);
```

### Changes Made

1. **Table Header**: Cost column header conditionally rendered
   ```typescript
   {canApprove && (
     <th>Cost</th>
   )}
   ```

2. **Table Data**: Cost cell conditionally rendered
   ```typescript
   {canApprove && (
     <td>{formatCurrency(timesheet.cost)}</td>
   )}
   ```

## Visibility by Role

| Role | Can See Cost? |
|------|---------------|
| Super Admin | ✅ Yes |
| Admin | ✅ Yes |
| Project Manager | ✅ Yes |
| Team Member | ❌ No |
| Client | ❌ No |

## Result

- ✅ Cost information is protected
- ✅ Only authorized roles can view costs
- ✅ Cleaner interface for team members
- ✅ Consistent with approval permissions

**The Cost column is now properly secured!** 🔒

