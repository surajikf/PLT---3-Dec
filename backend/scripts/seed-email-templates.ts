/**
 * Seed Email Templates
 * Creates default email templates for all system activities
 * Similar to Jira's email notification system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  // ==================== USER MANAGEMENT ====================
  {
    name: 'User Welcome Email',
    subject: 'Welcome to IKF Project Livetracker!',
    body: `Hello {{firstName}},

Welcome to IKF Project Livetracker! Your account has been successfully created.

Your login credentials:
Email: {{email}}
Temporary Password: {{temporaryPassword}}

Please log in and change your password as soon as possible.

Your Role: {{role}}
Department: {{departmentName}}

If you have any questions, please contact your administrator.

Best regards,
IKF Project Livetracker Team`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to IKF Project Livetracker!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{firstName}}</strong>,</p>
      <p>Welcome to IKF Project Livetracker! Your account has been successfully created.</p>
      
      <div class="info-box">
        <p><strong>Your Login Credentials:</strong></p>
        <p>Email: <strong>{{email}}</strong></p>
        <p>Temporary Password: <strong>{{temporaryPassword}}</strong></p>
        <p><strong>Please log in and change your password as soon as possible.</strong></p>
      </div>

      <p><strong>Your Role:</strong> {{role}}</p>
      {{#if departmentName}}
      <p><strong>Department:</strong> {{departmentName}}</p>
      {{/if}}

      <a href="{{loginUrl}}" class="button">Log In Now</a>

      <p>If you have any questions, please contact your administrator.</p>
      <p>Best regards,<br>IKF Project Livetracker Team</p>
    </div>
  </div>
</body>
</html>`,
    category: 'USER_WELCOME',
    variables: {
      firstName: 'User first name',
      email: 'User email address',
      temporaryPassword: 'Temporary password (if applicable)',
      role: 'User role',
      departmentName: 'Department name (optional)',
      loginUrl: 'Login page URL',
    },
    isActive: true,
  },
  {
    name: 'Password Reset Request',
    subject: 'Reset Your Password - IKF Project Livetracker',
    body: `Hello {{firstName}},

You requested to reset your password for your IKF Project Livetracker account.

Click the link below to reset your password:
{{resetLink}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email or contact support if you have concerns.

Best regards,
IKF Project Livetracker Team`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{firstName}}</strong>,</p>
      <p>You requested to reset your password for your IKF Project Livetracker account.</p>
      
      <a href="{{resetLink}}" class="button">Reset Password</a>

      <div class="warning">
        <p><strong>⚠️ Important:</strong> This link will expire in 1 hour.</p>
      </div>

      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>IKF Project Livetracker Team</p>
    </div>
  </div>
</body>
</html>`,
    category: 'PASSWORD_RESET',
    variables: {
      firstName: 'User first name',
      resetLink: 'Password reset link',
    },
    isActive: true,
  },

  // ==================== PROJECT MANAGEMENT ====================
  {
    name: 'Project Created',
    subject: 'New Project Created: {{projectName}}',
    body: `Hello {{recipientName}},

A new project has been created:

Project: {{projectName}}
Project Code: {{projectCode}}
Customer: {{customerName}}
Project Manager: {{managerName}}
Start Date: {{startDate}}
End Date: {{endDate}}
Budget: {{budget}}

Description:
{{description}}

You can view the project details here: {{projectUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .project-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #6b7280; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Project Created</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>A new project has been created:</p>
      
      <div class="project-info">
        <div class="info-row">
          <span class="info-label">Project:</span>
          <span><strong>{{projectName}}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Project Code:</span>
          <span>{{projectCode}}</span>
        </div>
        {{#if customerName}}
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span>{{customerName}}</span>
        </div>
        {{/if}}
        {{#if managerName}}
        <div class="info-row">
          <span class="info-label">Project Manager:</span>
          <span>{{managerName}}</span>
        </div>
        {{/if}}
        {{#if startDate}}
        <div class="info-row">
          <span class="info-label">Start Date:</span>
          <span>{{startDate}}</span>
        </div>
        {{/if}}
        {{#if endDate}}
        <div class="info-row">
          <span class="info-label">End Date:</span>
          <span>{{endDate}}</span>
        </div>
        {{/if}}
        <div class="info-row">
          <span class="info-label">Budget:</span>
          <span><strong>{{budget}}</strong></span>
        </div>
      </div>

      {{#if description}}
      <p><strong>Description:</strong></p>
      <p>{{description}}</p>
      {{/if}}

      <a href="{{projectUrl}}" class="button">View Project</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'PROJECT_CREATED',
    variables: {
      recipientName: 'Recipient name',
      projectName: 'Project name',
      projectCode: 'Project code',
      customerName: 'Customer name (optional)',
      managerName: 'Project manager name (optional)',
      startDate: 'Start date (optional)',
      endDate: 'End date (optional)',
      budget: 'Project budget',
      description: 'Project description (optional)',
      projectUrl: 'Project detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Project Assigned to User',
    subject: 'You have been assigned to project: {{projectName}}',
    body: `Hello {{userName}},

You have been assigned to the following project:

Project: {{projectName}}
Project Code: {{projectCode}}
{{#if managerName}}
Project Manager: {{managerName}}
{{/if}}
{{#if startDate}}
Start Date: {{startDate}}
{{/if}}
{{#if endDate}}
End Date: {{endDate}}
{{/if}}

View the project: {{projectUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Project Assignment</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>You have been assigned to the following project:</p>
      
      <p><strong>Project:</strong> {{projectName}}</p>
      <p><strong>Project Code:</strong> {{projectCode}}</p>
      {{#if managerName}}
      <p><strong>Project Manager:</strong> {{managerName}}</p>
      {{/if}}
      {{#if startDate}}
      <p><strong>Start Date:</strong> {{startDate}}</p>
      {{/if}}
      {{#if endDate}}
      <p><strong>End Date:</strong> {{endDate}}</p>
      {{/if}}

      <a href="{{projectUrl}}" class="button">View Project</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'PROJECT_ASSIGNED',
    variables: {
      userName: 'User name',
      projectName: 'Project name',
      projectCode: 'Project code',
      managerName: 'Project manager name (optional)',
      startDate: 'Start date (optional)',
      endDate: 'End date (optional)',
      projectUrl: 'Project detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Project Status Changed',
    subject: 'Project Status Updated: {{projectName}}',
    body: `Hello {{recipientName}},

The status of project "{{projectName}}" has been changed:

Previous Status: {{oldStatus}}
New Status: {{newStatus}}
{{#if changedBy}}
Changed By: {{changedBy}}
{{/if}}
{{#if reason}}
Reason: {{reason}}
{{/if}}

View the project: {{projectUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .status-change { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Project Status Updated</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>The status of project "<strong>{{projectName}}</strong>" has been changed:</p>
      
      <div class="status-change">
        <p><strong>Previous Status:</strong> {{oldStatus}}</p>
        <p><strong>New Status:</strong> <strong>{{newStatus}}</strong></p>
        {{#if changedBy}}
        <p><strong>Changed By:</strong> {{changedBy}}</p>
        {{/if}}
        {{#if reason}}
        <p><strong>Reason:</strong> {{reason}}</p>
        {{/if}}
      </div>

      <a href="{{projectUrl}}" class="button">View Project</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'PROJECT_STATUS_CHANGED',
    variables: {
      recipientName: 'Recipient name',
      projectName: 'Project name',
      oldStatus: 'Previous status',
      newStatus: 'New status',
      changedBy: 'User who made the change (optional)',
      reason: 'Reason for change (optional)',
      projectUrl: 'Project detail page URL',
    },
    isActive: true,
  },

  // ==================== TASK MANAGEMENT ====================
  {
    name: 'Task Assigned',
    subject: 'New Task Assigned: {{taskTitle}}',
    body: `Hello {{userName}},

A new task has been assigned to you:

Task: {{taskTitle}}
Project: {{projectName}}
{{#if priority}}
Priority: {{priority}}
{{/if}}
{{#if dueDate}}
Due Date: {{dueDate}}
{{/if}}
{{#if estimatedHours}}
Estimated Hours: {{estimatedHours}}
{{/if}}

{{#if description}}
Description:
{{description}}
{{/if}}

View the task: {{taskUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .task-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .priority-urgent { color: #dc2626; font-weight: bold; }
    .priority-high { color: #ea580c; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Task Assigned</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>A new task has been assigned to you:</p>
      
      <div class="task-info">
        <h2 style="margin-top: 0;">{{taskTitle}}</h2>
        <p><strong>Project:</strong> {{projectName}}</p>
        {{#if priority}}
        <p><strong>Priority:</strong> <span class="priority-{{priority}}">{{priority}}</span></p>
        {{/if}}
        {{#if dueDate}}
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        {{/if}}
        {{#if estimatedHours}}
        <p><strong>Estimated Hours:</strong> {{estimatedHours}}</p>
        {{/if}}
      </div>

      {{#if description}}
      <p><strong>Description:</strong></p>
      <p>{{description}}</p>
      {{/if}}

      <a href="{{taskUrl}}" class="button">View Task</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TASK_ASSIGNED',
    variables: {
      userName: 'User name',
      taskTitle: 'Task title',
      projectName: 'Project name',
      priority: 'Task priority (optional)',
      dueDate: 'Due date (optional)',
      estimatedHours: 'Estimated hours (optional)',
      description: 'Task description (optional)',
      taskUrl: 'Task detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Task Status Updated',
    subject: 'Task Status Updated: {{taskTitle}}',
    body: `Hello {{recipientName}},

The status of task "{{taskTitle}}" has been updated:

Previous Status: {{oldStatus}}
New Status: {{newStatus}}
Project: {{projectName}}
{{#if updatedBy}}
Updated By: {{updatedBy}}
{{/if}}

View the task: {{taskUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #06b6d4; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Task Status Updated</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>The status of task "<strong>{{taskTitle}}</strong>" has been updated:</p>
      
      <p><strong>Previous Status:</strong> {{oldStatus}}</p>
      <p><strong>New Status:</strong> <strong>{{newStatus}}</strong></p>
      <p><strong>Project:</strong> {{projectName}}</p>
      {{#if updatedBy}}
      <p><strong>Updated By:</strong> {{updatedBy}}</p>
      {{/if}}

      <a href="{{taskUrl}}" class="button">View Task</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TASK_STATUS_UPDATED',
    variables: {
      recipientName: 'Recipient name',
      taskTitle: 'Task title',
      oldStatus: 'Previous status',
      newStatus: 'New status',
      projectName: 'Project name',
      updatedBy: 'User who updated (optional)',
      taskUrl: 'Task detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Task Due Date Reminder',
    subject: 'Reminder: Task Due Soon - {{taskTitle}}',
    body: `Hello {{userName}},

This is a reminder that the following task is due soon:

Task: {{taskTitle}}
Project: {{projectName}}
Due Date: {{dueDate}}
{{#if daysRemaining}}
Days Remaining: {{daysRemaining}}
{{/if}}
{{#if priority}}
Priority: {{priority}}
{{/if}}

Please ensure the task is completed on time.

View the task: {{taskUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .reminder-box { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Task Due Soon</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>This is a reminder that the following task is due soon:</p>
      
      <div class="reminder-box">
        <h2 style="margin-top: 0;">{{taskTitle}}</h2>
        <p><strong>Project:</strong> {{projectName}}</p>
        <p><strong>Due Date:</strong> <strong>{{dueDate}}</strong></p>
        {{#if daysRemaining}}
        <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
        {{/if}}
        {{#if priority}}
        <p><strong>Priority:</strong> {{priority}}</p>
        {{/if}}
      </div>

      <p>Please ensure the task is completed on time.</p>

      <a href="{{taskUrl}}" class="button">View Task</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TASK_DUE_REMINDER',
    variables: {
      userName: 'User name',
      taskTitle: 'Task title',
      projectName: 'Project name',
      dueDate: 'Due date',
      daysRemaining: 'Days remaining (optional)',
      priority: 'Task priority (optional)',
      taskUrl: 'Task detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Task Overdue',
    subject: '⚠️ Task Overdue: {{taskTitle}}',
    body: `Hello {{userName}},

The following task is now overdue:

Task: {{taskTitle}}
Project: {{projectName}}
Due Date: {{dueDate}}
{{#if daysOverdue}}
Days Overdue: {{daysOverdue}}
{{/if}}
{{#if priority}}
Priority: {{priority}}
{{/if}}

Please update the task status or contact your project manager.

View the task: {{taskUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .overdue-box { background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Task Overdue</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>The following task is now overdue:</p>
      
      <div class="overdue-box">
        <h2 style="margin-top: 0;">{{taskTitle}}</h2>
        <p><strong>Project:</strong> {{projectName}}</p>
        <p><strong>Due Date:</strong> <strong>{{dueDate}}</strong></p>
        {{#if daysOverdue}}
        <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
        {{/if}}
        {{#if priority}}
        <p><strong>Priority:</strong> {{priority}}</p>
        {{/if}}
      </div>

      <p>Please update the task status or contact your project manager.</p>

      <a href="{{taskUrl}}" class="button">View Task</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TASK_OVERDUE',
    variables: {
      userName: 'User name',
      taskTitle: 'Task title',
      projectName: 'Project name',
      dueDate: 'Due date',
      daysOverdue: 'Days overdue (optional)',
      priority: 'Task priority (optional)',
      taskUrl: 'Task detail page URL',
    },
    isActive: true,
  },

  // ==================== TIMESHEET MANAGEMENT ====================
  {
    name: 'Timesheet Submitted',
    subject: 'Timesheet Submitted for Approval - Week of {{weekStartDate}}',
    body: `Hello {{approverName}},

{{submitterName}} has submitted a timesheet for your approval:

Week: {{weekStartDate}} to {{weekEndDate}}
Total Hours: {{totalHours}}
{{#if projectName}}
Project: {{projectName}}
{{/if}}

Please review and approve or reject the timesheet.

View timesheet: {{timesheetUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .timesheet-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Timesheet Submitted</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{approverName}}</strong>,</p>
      <p><strong>{{submitterName}}</strong> has submitted a timesheet for your approval:</p>
      
      <div class="timesheet-info">
        <p><strong>Week:</strong> {{weekStartDate}} to {{weekEndDate}}</p>
        <p><strong>Total Hours:</strong> {{totalHours}}</p>
        {{#if projectName}}
        <p><strong>Project:</strong> {{projectName}}</p>
        {{/if}}
      </div>

      <p>Please review and approve or reject the timesheet.</p>

      <a href="{{timesheetUrl}}" class="button">Review Timesheet</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TIMESHEET_SUBMITTED',
    variables: {
      approverName: 'Approver name',
      submitterName: 'Person who submitted',
      weekStartDate: 'Week start date',
      weekEndDate: 'Week end date',
      totalHours: 'Total hours',
      projectName: 'Project name (optional)',
      timesheetUrl: 'Timesheet review page URL',
    },
    isActive: true,
  },
  {
    name: 'Timesheet Approved',
    subject: 'Timesheet Approved - Week of {{weekStartDate}}',
    body: `Hello {{userName}},

Your timesheet for the week of {{weekStartDate}} has been approved.

Week: {{weekStartDate}} to {{weekEndDate}}
Total Hours: {{totalHours}}
{{#if approvedBy}}
Approved By: {{approvedBy}}
{{/if}}
{{#if approvedAt}}
Approved At: {{approvedAt}}
{{/if}}

View timesheet: {{timesheetUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Timesheet Approved</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your timesheet for the week of <strong>{{weekStartDate}}</strong> has been approved.</p>
      
      <div class="success-box">
        <p><strong>Week:</strong> {{weekStartDate}} to {{weekEndDate}}</p>
        <p><strong>Total Hours:</strong> {{totalHours}}</p>
        {{#if approvedBy}}
        <p><strong>Approved By:</strong> {{approvedBy}}</p>
        {{/if}}
        {{#if approvedAt}}
        <p><strong>Approved At:</strong> {{approvedAt}}</p>
        {{/if}}
      </div>

      <a href="{{timesheetUrl}}" class="button">View Timesheet</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TIMESHEET_APPROVED',
    variables: {
      userName: 'User name',
      weekStartDate: 'Week start date',
      weekEndDate: 'Week end date',
      totalHours: 'Total hours',
      approvedBy: 'Approver name (optional)',
      approvedAt: 'Approval timestamp (optional)',
      timesheetUrl: 'Timesheet detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Timesheet Rejected',
    subject: 'Timesheet Rejected - Week of {{weekStartDate}}',
    body: `Hello {{userName}},

Your timesheet for the week of {{weekStartDate}} has been rejected.

Week: {{weekStartDate}} to {{weekEndDate}}
Total Hours: {{totalHours}}
{{#if rejectedBy}}
Rejected By: {{rejectedBy}}
{{/if}}
{{#if rejectionReason}}
Reason: {{rejectionReason}}
{{/if}}

Please review the feedback and resubmit your timesheet.

View timesheet: {{timesheetUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .rejection-box { background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Timesheet Rejected</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your timesheet for the week of <strong>{{weekStartDate}}</strong> has been rejected.</p>
      
      <div class="rejection-box">
        <p><strong>Week:</strong> {{weekStartDate}} to {{weekEndDate}}</p>
        <p><strong>Total Hours:</strong> {{totalHours}}</p>
        {{#if rejectedBy}}
        <p><strong>Rejected By:</strong> {{rejectedBy}}</p>
        {{/if}}
        {{#if rejectionReason}}
        <p><strong>Reason:</strong></p>
        <p>{{rejectionReason}}</p>
        {{/if}}
      </div>

      <p>Please review the feedback and resubmit your timesheet.</p>

      <a href="{{timesheetUrl}}" class="button">View Timesheet</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TIMESHEET_REJECTED',
    variables: {
      userName: 'User name',
      weekStartDate: 'Week start date',
      weekEndDate: 'Week end date',
      totalHours: 'Total hours',
      rejectedBy: 'Rejector name (optional)',
      rejectionReason: 'Rejection reason (optional)',
      timesheetUrl: 'Timesheet detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Timesheet Reminder',
    subject: 'Reminder: Submit Your Timesheet - Week of {{weekStartDate}}',
    body: `Hello {{userName}},

This is a reminder to submit your timesheet for the week of {{weekStartDate}}.

Week: {{weekStartDate}} to {{weekEndDate}}
{{#if hoursLogged}}
Hours Logged: {{hoursLogged}}
{{/if}}

Please submit your timesheet before the deadline.

Submit timesheet: {{timesheetUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .reminder-box { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Timesheet Reminder</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>This is a reminder to submit your timesheet for the week of <strong>{{weekStartDate}}</strong>.</p>
      
      <div class="reminder-box">
        <p><strong>Week:</strong> {{weekStartDate}} to {{weekEndDate}}</p>
        {{#if hoursLogged}}
        <p><strong>Hours Logged:</strong> {{hoursLogged}}</p>
        {{/if}}
      </div>

      <p>Please submit your timesheet before the deadline.</p>

      <a href="{{timesheetUrl}}" class="button">Submit Timesheet</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'TIMESHEET_REMINDER',
    variables: {
      userName: 'User name',
      weekStartDate: 'Week start date',
      weekEndDate: 'Week end date',
      hoursLogged: 'Hours logged so far (optional)',
      timesheetUrl: 'Timesheet submission page URL',
    },
    isActive: true,
  },

  // ==================== STAGE MANAGEMENT ====================
  {
    name: 'Stage Status Changed',
    subject: 'Stage Status Updated: {{stageName}} - {{projectName}}',
    body: `Hello {{recipientName}},

The status of stage "{{stageName}}" in project "{{projectName}}" has been changed:

Previous Status: {{oldStatus}}
New Status: {{newStatus}}
{{#if changedBy}}
Changed By: {{changedBy}}
{{/if}}
{{#if completedDate}}
Completed Date: {{completedDate}}
{{/if}}

View the project: {{projectUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #06b6d4; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Stage Status Updated</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>The status of stage "<strong>{{stageName}}</strong>" in project "<strong>{{projectName}}</strong>" has been changed:</p>
      
      <p><strong>Previous Status:</strong> {{oldStatus}}</p>
      <p><strong>New Status:</strong> <strong>{{newStatus}}</strong></p>
      {{#if changedBy}}
      <p><strong>Changed By:</strong> {{changedBy}}</p>
      {{/if}}
      {{#if completedDate}}
      <p><strong>Completed Date:</strong> {{completedDate}}</p>
      {{/if}}

      <a href="{{projectUrl}}" class="button">View Project</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'STAGE_STATUS_CHANGED',
    variables: {
      recipientName: 'Recipient name',
      stageName: 'Stage name',
      projectName: 'Project name',
      oldStatus: 'Previous status',
      newStatus: 'New status',
      changedBy: 'User who changed (optional)',
      completedDate: 'Completion date (optional)',
      projectUrl: 'Project detail page URL',
    },
    isActive: true,
  },

  // ==================== APPROVAL MANAGEMENT ====================
  {
    name: 'Approval Request',
    subject: 'Approval Required: {{entityType}} - {{entityName}}',
    body: `Hello {{approverName}},

You have a pending approval request:

Type: {{entityType}}
Name: {{entityName}}
{{#if requestedBy}}
Requested By: {{requestedBy}}
{{/if}}
{{#if requestDate}}
Request Date: {{requestDate}}
{{/if}}
{{#if description}}
Description:
{{description}}
{{/if}}

Please review and approve or reject this request.

View request: {{approvalUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .request-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
    .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Approval Required</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{approverName}}</strong>,</p>
      <p>You have a pending approval request:</p>
      
      <div class="request-box">
        <p><strong>Type:</strong> {{entityType}}</p>
        <p><strong>Name:</strong> {{entityName}}</p>
        {{#if requestedBy}}
        <p><strong>Requested By:</strong> {{requestedBy}}</p>
        {{/if}}
        {{#if requestDate}}
        <p><strong>Request Date:</strong> {{requestDate}}</p>
        {{/if}}
        {{#if description}}
        <p><strong>Description:</strong></p>
        <p>{{description}}</p>
        {{/if}}
      </div>

      <p>Please review and approve or reject this request.</p>

      <a href="{{approvalUrl}}" class="button">Review Request</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'APPROVAL_REQUEST',
    variables: {
      approverName: 'Approver name',
      entityType: 'Entity type (e.g., TIMESHEET, PROJECT)',
      entityName: 'Entity name',
      requestedBy: 'Requester name (optional)',
      requestDate: 'Request date (optional)',
      description: 'Request description (optional)',
      approvalUrl: 'Approval page URL',
    },
    isActive: true,
  },
  {
    name: 'Approval Request Approved',
    subject: 'Approval Request Approved: {{entityName}}',
    body: `Hello {{requesterName}},

Your approval request has been approved:

Type: {{entityType}}
Name: {{entityName}}
{{#if approvedBy}}
Approved By: {{approvedBy}}
{{/if}}
{{#if approvedAt}}
Approved At: {{approvedAt}}
{{/if}}

View details: {{entityUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Approval Approved</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{requesterName}}</strong>,</p>
      <p>Your approval request has been approved:</p>
      
      <div class="success-box">
        <p><strong>Type:</strong> {{entityType}}</p>
        <p><strong>Name:</strong> {{entityName}}</p>
        {{#if approvedBy}}
        <p><strong>Approved By:</strong> {{approvedBy}}</p>
        {{/if}}
        {{#if approvedAt}}
        <p><strong>Approved At:</strong> {{approvedAt}}</p>
        {{/if}}
      </div>

      <a href="{{entityUrl}}" class="button">View Details</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'APPROVAL_APPROVED',
    variables: {
      requesterName: 'Requester name',
      entityType: 'Entity type',
      entityName: 'Entity name',
      approvedBy: 'Approver name (optional)',
      approvedAt: 'Approval timestamp (optional)',
      entityUrl: 'Entity detail page URL',
    },
    isActive: true,
  },
  {
    name: 'Approval Request Rejected',
    subject: 'Approval Request Rejected: {{entityName}}',
    body: `Hello {{requesterName}},

Your approval request has been rejected:

Type: {{entityType}}
Name: {{entityName}}
{{#if rejectedBy}}
Rejected By: {{rejectedBy}}
{{/if}}
{{#if rejectedAt}}
Rejected At: {{rejectedAt}}
{{/if}}
{{#if rejectionReason}}
Reason: {{rejectionReason}}
{{/if}}

View details: {{entityUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .rejection-box { background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Approval Rejected</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{requesterName}}</strong>,</p>
      <p>Your approval request has been rejected:</p>
      
      <div class="rejection-box">
        <p><strong>Type:</strong> {{entityType}}</p>
        <p><strong>Name:</strong> {{entityName}}</p>
        {{#if rejectedBy}}
        <p><strong>Rejected By:</strong> {{rejectedBy}}</p>
        {{/if}}
        {{#if rejectedAt}}
        <p><strong>Rejected At:</strong> {{rejectedAt}}</p>
        {{/if}}
        {{#if rejectionReason}}
        <p><strong>Reason:</strong></p>
        <p>{{rejectionReason}}</p>
        {{/if}}
      </div>

      <a href="{{entityUrl}}" class="button">View Details</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'APPROVAL_REJECTED',
    variables: {
      requesterName: 'Requester name',
      entityType: 'Entity type',
      entityName: 'Entity name',
      rejectedBy: 'Rejector name (optional)',
      rejectedAt: 'Rejection timestamp (optional)',
      rejectionReason: 'Rejection reason (optional)',
      entityUrl: 'Entity detail page URL',
    },
    isActive: true,
  },

  // ==================== RESOURCE MANAGEMENT ====================
  {
    name: 'Resource Assigned',
    subject: 'Resource Assigned: {{resourceName}}',
    body: `Hello {{recipientName}},

A resource has been assigned to you:

Resource: {{resourceName}}
{{#if resourceType}}
Type: {{resourceType}}
{{/if}}
{{#if projectName}}
Project: {{projectName}}
{{/if}}
{{#if description}}
Description:
{{description}}
{{/if}}
{{#if resourceUrl}}
Resource URL: {{resourceUrl}}
{{/if}}

View resource: {{resourceDetailUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Resource Assigned</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>A resource has been assigned to you:</p>
      
      <p><strong>Resource:</strong> {{resourceName}}</p>
      {{#if resourceType}}
      <p><strong>Type:</strong> {{resourceType}}</p>
      {{/if}}
      {{#if projectName}}
      <p><strong>Project:</strong> {{projectName}}</p>
      {{/if}}
      {{#if description}}
      <p><strong>Description:</strong></p>
      <p>{{description}}</p>
      {{/if}}
      {{#if resourceUrl}}
      <p><strong>Resource URL:</strong> <a href="{{resourceUrl}}">{{resourceUrl}}</a></p>
      {{/if}}

      <a href="{{resourceDetailUrl}}" class="button">View Resource</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'RESOURCE_ASSIGNED',
    variables: {
      recipientName: 'Recipient name',
      resourceName: 'Resource name',
      resourceType: 'Resource type (optional)',
      projectName: 'Project name (optional)',
      description: 'Resource description (optional)',
      resourceUrl: 'Resource URL (optional)',
      resourceDetailUrl: 'Resource detail page URL',
    },
    isActive: true,
  },

  // ==================== PROJECT HEALTH ====================
  {
    name: 'Project Health Alert',
    subject: '⚠️ Project Health Alert: {{projectName}}',
    body: `Hello {{recipientName}},

The following project has a health alert:

Project: {{projectName}}
Project Code: {{projectCode}}
Health Score: {{healthScore}}/100
{{#if healthStatus}}
Status: {{healthStatus}}
{{/if}}
{{#if alertReason}}
Reason: {{alertReason}}
{{/if}}

Please review the project and take necessary actions.

View project: {{projectUrl}}

Best regards,
IKF Project Livetracker`,
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 6px; }
    .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Project Health Alert</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{recipientName}}</strong>,</p>
      <p>The following project has a health alert:</p>
      
      <div class="alert-box">
        <p><strong>Project:</strong> {{projectName}}</p>
        <p><strong>Project Code:</strong> {{projectCode}}</p>
        <p><strong>Health Score:</strong> <strong>{{healthScore}}/100</strong></p>
        {{#if healthStatus}}
        <p><strong>Status:</strong> {{healthStatus}}</p>
        {{/if}}
        {{#if alertReason}}
        <p><strong>Reason:</strong> {{alertReason}}</p>
        {{/if}}
      </div>

      <p>Please review the project and take necessary actions.</p>

      <a href="{{projectUrl}}" class="button">View Project</a>

      <p>Best regards,<br>IKF Project Livetracker</p>
    </div>
  </div>
</body>
</html>`,
    category: 'PROJECT_HEALTH_ALERT',
    variables: {
      recipientName: 'Recipient name',
      projectName: 'Project name',
      projectCode: 'Project code',
      healthScore: 'Health score (0-100)',
      healthStatus: 'Health status (optional)',
      alertReason: 'Alert reason (optional)',
      projectUrl: 'Project detail page URL',
    },
    isActive: true,
  },
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  // Get a super admin user to use as creator
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
    },
  });

  if (!adminUser) {
    console.error('❌ No SUPER_ADMIN user found. Please create one first.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const template of emailTemplates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${template.name}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.emailTemplate.create({
        data: {
          ...template,
          createdById: adminUser.id,
        },
      });

      console.log(`✅ Created template: "${template.name}"`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating template "${template.name}":`, error);
    }
  }

  console.log(`\n✨ Seeding complete! Created: ${created}, Skipped: ${skipped}`);
}

seedEmailTemplates()
  .catch((error) => {
    console.error('Error seeding email templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

