# Profile Picture Feature - Setup Guide

## ✅ Implementation Complete

### Features Added:
1. ✅ Profile picture field added to User model
2. ✅ Avatar component with initials fallback (Jira-style)
3. ✅ Profile picture upload in ProfilePage
4. ✅ Backend API support for profile pictures
5. ✅ Avatar displayed in Layout header
6. ✅ Consistent color generation for initials

## 🚀 Setup Steps

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_profile_picture
npx prisma generate
```

### 2. Update Existing Users (Optional)

To add dummy photos or ensure all users have initials displayed, you can run:

```sql
-- All users will automatically show initials if no profile picture is set
-- The Avatar component handles this automatically
```

## 📝 Usage

### For Users:
1. Go to Profile page (`/profile`)
2. Click "Upload Photo" button
3. Select an image file (JPG, PNG, GIF - max 5MB)
4. Image will be converted to base64 and stored
5. Click "Save" to update profile

### For Developers:
Use the Avatar component anywhere users are displayed:

```tsx
import Avatar from '../components/Avatar';

<Avatar
  firstName={user.firstName}
  lastName={user.lastName}
  profilePicture={user.profilePicture}
  size="md" // xs, sm, md, lg, xl
/>
```

## 🎨 Avatar Features

- **Automatic Initials**: Shows first letter of first name + first letter of last name
- **Consistent Colors**: Same user always gets same color based on name hash
- **Image Fallback**: If image fails to load, automatically shows initials
- **Multiple Sizes**: xs, sm, md, lg, xl
- **Jira-style**: Similar appearance to Jira avatars

## 📊 Database Schema

```prisma
model User {
  profilePicture String?  // URL or base64 data URL
  // ... other fields
}
```

## 🔧 Backend API

### Update Profile (includes profilePicture):
```
PATCH /api/users/profile
Body: {
  firstName: string,
  lastName: string,
  profilePicture: string | null  // base64 data URL or URL
}
```

## 💡 Notes

- Profile pictures are stored as base64 data URLs in the database
- For production, consider using a file storage service (AWS S3, Cloudinary, etc.)
- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF
- If no picture is set, initials are automatically displayed

---

**Status**: ✅ Ready to use!




