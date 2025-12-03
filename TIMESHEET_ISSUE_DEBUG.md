# Timesheet Display Issue - Debugging Guide

## ✅ Database Status
- ✅ Database connected successfully
- ✅ Timesheet table exists
- ✅ **504 timesheets** found in database
- ✅ Recent timesheets are being saved

## 🔍 Potential Issues

### Issue 1: Role-Based Filtering
The backend filters timesheets based on user role:

**For TEAM_MEMBER**: Only sees their own timesheets
```typescript
if (currentUser.role === 'TEAM_MEMBER') {
  where.userId = currentUser.userId;
}
```

**For PROJECT_MANAGER**: Only sees timesheets for their projects
```typescript
else if (currentUser.role === 'PROJECT_MANAGER') {
  where.project = {
    managerId: currentUser.userId,
  };
}
```

**For ADMIN/SUPER_ADMIN**: Sees all timesheets (no filter)

### Issue 2: API Response Structure
Check browser console for:
- API errors
- Network request failures
- Authentication issues

### Issue 3: Frontend Query Key
The frontend uses React Query with key 'timesheets':
```typescript
const { data, refetch } = useQuery('timesheets', async () => {
  const res = await api.get('/timesheets');
  return res.data.data;
});
```

## 🔧 Solutions

### Solution 1: Check User Role
1. Check what role you're logged in as
2. If TEAM_MEMBER, you'll only see your own timesheets
3. If PROJECT_MANAGER, you'll only see timesheets for your projects

### Solution 2: Verify API Response
Open browser DevTools → Network tab:
1. Filter for "timesheets"
2. Check the response
3. Verify `res.data.data` contains the timesheets array

### Solution 3: Check Browser Console
Look for:
- API errors
- React Query errors
- Authentication token issues

### Solution 4: Force Refresh
Try refreshing the React Query cache:
```typescript
queryClient.invalidateQueries('timesheets');
```

## 📊 Current Database Status
- Total timesheets: 504
- Recent timesheet: Super Admin - TACC | 03-03-2025 (3.75 hours, SUBMITTED)
- Status: Database is working correctly

## 🎯 Next Steps
1. Check your user role
2. Check browser console for errors
3. Check Network tab for API response
4. Try logging in as SUPER_ADMIN to see all timesheets

