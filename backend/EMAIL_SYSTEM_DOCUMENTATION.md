# Email Master System Documentation

## Overview

The Email Master system provides a comprehensive email notification system similar to Jira, with pre-configured templates for all system activities. All templates are dynamic and can be customized through the Email Master interface.

## Features

- **20+ Pre-configured Email Templates** covering all system activities
- **Dynamic Variable Replacement** - Templates use `{{variableName}}` syntax
- **HTML Email Support** - Beautiful, responsive HTML emails
- **Role-based Email Sending** - Different templates for different user roles
- **Activity-based Categories** - Organized by system activity type
- **Test Email Functionality** - Test templates before sending

## Email Templates by Category

### User Management
- **USER_WELCOME** - Welcome email for new users
- **PASSWORD_RESET** - Password reset request email

### Project Management
- **PROJECT_CREATED** - Notification when a project is created
- **PROJECT_ASSIGNED** - Notification when user is assigned to a project
- **PROJECT_STATUS_CHANGED** - Notification when project status changes
- **PROJECT_HEALTH_ALERT** - Alert when project health score is low

### Task Management
- **TASK_ASSIGNED** - Notification when a task is assigned
- **TASK_STATUS_UPDATED** - Notification when task status changes
- **TASK_DUE_REMINDER** - Reminder before task due date
- **TASK_OVERDUE** - Alert when task is overdue

### Timesheet Management
- **TIMESHEET_SUBMITTED** - Notification to approver when timesheet is submitted
- **TIMESHEET_APPROVED** - Notification to user when timesheet is approved
- **TIMESHEET_REJECTED** - Notification to user when timesheet is rejected
- **TIMESHEET_REMINDER** - Reminder to submit timesheet

### Stage Management
- **STAGE_STATUS_CHANGED** - Notification when project stage status changes

### Approval Management
- **APPROVAL_REQUEST** - Notification to approver for pending approval
- **APPROVAL_APPROVED** - Notification when approval is granted
- **APPROVAL_REJECTED** - Notification when approval is rejected

### Resource Management
- **RESOURCE_ASSIGNED** - Notification when resource is assigned

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_email_templates
npx prisma generate
```

### 3. Seed Email Templates

```bash
npm run seed-email-templates
```

This will create all default email templates in the database.

### 4. Configure SMTP Settings

Add these environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ikf.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

**Note:** For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password (not your regular password)
3. Use the App Password in `SMTP_PASS`

## Usage

### Sending Emails Programmatically

Use the email notification helpers from `emailNotifications.ts`:

```typescript
import {
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendTimesheetSubmittedEmail,
  // ... other functions
} from './utils/emailNotifications';

// Send welcome email
await sendWelcomeEmail(user, temporaryPassword);

// Send task assigned email
await sendTaskAssignedEmail(task, user);

// Send timesheet submitted email
await sendTimesheetSubmittedEmail(timesheet, approver);
```

### Custom Email Sending

For custom emails, use the generic function:

```typescript
import { sendEmailNotification, EmailActivityType } from './utils/emailNotifications';

await sendEmailNotification({
  activityType: EmailActivityType.PROJECT_CREATED,
  recipients: [
    { email: 'user@example.com', name: 'John Doe' }
  ],
  variables: {
    projectName: 'My Project',
    projectCode: 'PROJ-001',
    // ... other variables
  },
});
```

### Template Variables

Each template has specific variables. Check the template in the Email Master interface to see available variables. Common variables include:

- `{{firstName}}`, `{{lastName}}`, `{{userName}}` - User information
- `{{projectName}}`, `{{projectCode}}` - Project information
- `{{taskTitle}}`, `{{taskStatus}}` - Task information
- `{{baseUrl}}` - Base URL for links (automatically added)

### Conditional Variables

Templates support conditional blocks using Handlebars-style syntax:

```
{{#if variableName}}
This will only show if variableName has a value
{{/if}}
```

If a variable is empty or not provided, the entire block will be removed automatically.

## Managing Templates

### Via Email Master UI

1. Navigate to **Email Master** in the navigation menu (Admin/Super Admin only)
2. View all templates organized by category
3. Click **Edit** to modify a template
4. Click **Send Test Email** to test a template
5. Use **Search** and **Category Filter** to find templates

### Template Structure

Each template has:
- **Name** - Unique template name
- **Subject** - Email subject line
- **Body** - Plain text email body
- **Body HTML** - HTML email body (optional)
- **Category** - Activity type category
- **Variables** - JSON object defining available variables
- **Status** - Active/Inactive

### Best Practices

1. **Always test templates** before using them in production
2. **Keep HTML templates responsive** - Many users read emails on mobile
3. **Use clear, actionable subject lines**
4. **Include relevant links** to the application
5. **Keep templates concise** - Users prefer short, focused emails
6. **Use consistent branding** across all templates

## Integration Points

### Where to Add Email Sending

Add email notifications in these controllers/services:

1. **User Controller** (`userController.ts`)
   - After user creation → `sendWelcomeEmail()`
   - After password reset request → `sendPasswordResetEmail()`

2. **Project Controller** (`projectController.ts`)
   - After project creation → `sendProjectCreatedEmail()`
   - After project assignment → `sendProjectAssignedEmail()`
   - After status change → `sendProjectStatusChangedEmail()`

3. **Task Controller** (`taskController.ts`)
   - After task assignment → `sendTaskAssignedEmail()`
   - After status update → Send appropriate email

4. **Timesheet Controller** (`timesheetController.ts`)
   - After submission → `sendTimesheetSubmittedEmail()`
   - After approval → `sendTimesheetApprovedEmail()`
   - After rejection → `sendTimesheetRejectedEmail()`

5. **Cron Jobs** (`cronJobs.ts`)
   - Daily task due reminders → `sendTaskDueReminderEmail()`
   - Weekly timesheet reminders → `sendTimesheetReminderEmail()`
   - Project health checks → `sendProjectHealthAlertEmail()`

## Email Activity Types

All activity types are defined in `EmailActivityType` enum:

```typescript
enum EmailActivityType {
  USER_WELCOME = 'USER_WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  PROJECT_HEALTH_ALERT = 'PROJECT_HEALTH_ALERT',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_UPDATED = 'TASK_STATUS_UPDATED',
  TASK_DUE_REMINDER = 'TASK_DUE_REMINDER',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TIMESHEET_SUBMITTED = 'TIMESHEET_SUBMITTED',
  TIMESHEET_APPROVED = 'TIMESHEET_APPROVED',
  TIMESHEET_REJECTED = 'TIMESHEET_REJECTED',
  TIMESHEET_REMINDER = 'TIMESHEET_REMINDER',
  STAGE_STATUS_CHANGED = 'STAGE_STATUS_CHANGED',
  APPROVAL_REQUEST = 'APPROVAL_REQUEST',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  RESOURCE_ASSIGNED = 'RESOURCE_ASSIGNED',
}
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration** - Verify all SMTP environment variables are set
2. **Check Email Service Logs** - Look for error messages in console
3. **Test SMTP Connection** - Use the test email feature in Email Master
4. **Check Template Status** - Ensure template is marked as Active
5. **Verify Recipient Email** - Make sure recipient email is valid

### Template Variables Not Replacing

1. **Check Variable Names** - Variable names are case-sensitive
2. **Check Variable Format** - Use `{{variableName}}` syntax
3. **Verify Variables Provided** - Ensure all required variables are passed

### HTML Emails Not Rendering

1. **Check HTML Template** - Ensure HTML is valid
2. **Test in Email Client** - Different clients render HTML differently
3. **Use Inline Styles** - Some email clients don't support external stylesheets

## Future Enhancements

- Email preferences per user (opt-in/opt-out)
- Email digest (daily/weekly summary)
- Email templates per role
- Rich text editor for template editing
- Email analytics (open rates, click rates)
- Multi-language support


