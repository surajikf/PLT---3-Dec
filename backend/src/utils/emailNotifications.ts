/**
 * Email Notification System
 * Integrates email templates with system activities
 * Similar to Jira's email notification system
 */

import prisma from './prisma';
import { sendTemplatedEmail } from './emailService';

export enum EmailActivityType {
  // User Management
  USER_WELCOME = 'USER_WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Project Management
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  PROJECT_HEALTH_ALERT = 'PROJECT_HEALTH_ALERT',
  
  // Task Management
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_UPDATED = 'TASK_STATUS_UPDATED',
  TASK_DUE_REMINDER = 'TASK_DUE_REMINDER',
  TASK_OVERDUE = 'TASK_OVERDUE',
  
  // Timesheet Management
  TIMESHEET_SUBMITTED = 'TIMESHEET_SUBMITTED',
  TIMESHEET_APPROVED = 'TIMESHEET_APPROVED',
  TIMESHEET_REJECTED = 'TIMESHEET_REJECTED',
  TIMESHEET_REMINDER = 'TIMESHEET_REMINDER',
  
  // Stage Management
  STAGE_STATUS_CHANGED = 'STAGE_STATUS_CHANGED',
  
  // Approval Management
  APPROVAL_REQUEST = 'APPROVAL_REQUEST',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  
  // Resource Management
  RESOURCE_ASSIGNED = 'RESOURCE_ASSIGNED',
}

interface EmailRecipient {
  email: string;
  name?: string;
  role?: string;
}

interface SendEmailOptions {
  activityType: EmailActivityType;
  recipients: EmailRecipient[];
  variables: Record<string, string | number | null | undefined>;
  baseUrl?: string;
}

/**
 * Get email template by category/activity type
 */
async function getEmailTemplate(category: string) {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      category,
      isActive: true,
    },
  });

  if (!template) {
    const { logger } = await import('./logger');
    logger.warn(`No active email template found for category: ${category}`);
    return null;
  }

  return template;
}

/**
 * Format currency
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Send email notification for a specific activity
 */
export async function sendEmailNotification(options: SendEmailOptions): Promise<void> {
  const { activityType, recipients, variables, baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173' } = options;

  const template = await getEmailTemplate(activityType);
  if (!template) {
    const { logger } = await import('./logger');
    logger.warn(`Cannot send email: No template found for ${activityType}`);
    return;
  }

  // Add base URL to variables for generating links
  const enrichedVariables = {
    ...variables,
    baseUrl,
  };

  // Send email to each recipient
  const emailPromises = recipients.map(async (recipient) => {
    try {
      const recipientVariables = {
        ...enrichedVariables,
        recipientName: recipient.name || recipient.email.split('@')[0],
        userName: recipient.name || recipient.email.split('@')[0],
        email: recipient.email,
      };

      await sendTemplatedEmail(
        recipient.email,
        template.subject,
        template.body,
        template.bodyHtml || undefined,
        recipientVariables
      );

      const { logger } = await import('./logger');
      logger.info(`Email sent to ${recipient.email} for ${activityType}`);
    } catch (error) {
      const { logger } = await import('./logger');
      logger.error(`Failed to send email to ${recipient.email} for ${activityType}:`, error);
      // Don't throw - continue with other recipients
    }
  });

  await Promise.allSettled(emailPromises);
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  user: { email: string; firstName: string; lastName: string; role: string; department?: { name: string } | null },
  temporaryPassword?: string
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  await sendEmailNotification({
    activityType: EmailActivityType.USER_WELCOME,
    recipients: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
    variables: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      temporaryPassword: temporaryPassword || '',
      role: user.role,
      departmentName: user.department?.name || '',
      loginUrl: `${baseUrl}/login`,
    },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  user: { email: string; firstName: string },
  resetToken: string
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  await sendEmailNotification({
    activityType: EmailActivityType.PASSWORD_RESET,
    recipients: [{ email: user.email, name: user.firstName }],
    variables: {
      firstName: user.firstName,
      resetLink,
    },
  });
}

/**
 * Send project created email
 */
export async function sendProjectCreatedEmail(
  project: {
    id: string;
    name: string;
    code: string;
    customer?: { name: string } | null;
    manager?: { firstName: string; lastName: string } | null;
    startDate?: Date | null;
    endDate?: Date | null;
    budget: number | null;
    description?: string | null;
  },
  recipients: EmailRecipient[]
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.PROJECT_CREATED,
    recipients,
    variables: {
      projectName: project.name,
      projectCode: project.code,
      customerName: project.customer?.name || '',
      managerName: project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : '',
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      budget: formatCurrency(project.budget),
      description: project.description || '',
      projectUrl: `${baseUrl}/projects/${project.id}`,
    },
  });
}

/**
 * Send project assigned email
 */
export async function sendProjectAssignedEmail(
  project: {
    id: string;
    name: string;
    code: string;
    manager?: { firstName: string; lastName: string } | null;
    startDate?: Date | null;
    endDate?: Date | null;
  },
  user: { email: string; firstName: string; lastName: string }
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.PROJECT_ASSIGNED,
    recipients: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
    variables: {
      userName: `${user.firstName} ${user.lastName}`,
      projectName: project.name,
      projectCode: project.code,
      managerName: project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : '',
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      projectUrl: `${baseUrl}/projects/${project.id}`,
    },
  });
}

/**
 * Send task assigned email
 */
export async function sendTaskAssignedEmail(
  task: {
    id: string;
    title: string;
    priority: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    description?: string | null;
    project: { id: string; name: string };
  },
  user: { email: string; firstName: string; lastName: string }
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.TASK_ASSIGNED,
    recipients: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
    variables: {
      userName: `${user.firstName} ${user.lastName}`,
      taskTitle: task.title,
      projectName: task.project.name,
      priority: task.priority,
      dueDate: formatDate(task.dueDate, 'long'),
      estimatedHours: task.estimatedHours?.toString() || '',
      description: task.description || '',
      taskUrl: `${baseUrl}/projects/${task.project.id}?task=${task.id}`,
    },
  });
}

/**
 * Send timesheet submitted email
 */
export async function sendTimesheetSubmittedEmail(
  timesheet: {
    id: string;
    date: Date;
    hours: number;
    user: { firstName: string; lastName: string };
    project?: { name: string } | null;
  },
  approver: { email: string; firstName: string; lastName: string }
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const weekStart = new Date(timesheet.date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  await sendEmailNotification({
    activityType: EmailActivityType.TIMESHEET_SUBMITTED,
    recipients: [{ email: approver.email, name: `${approver.firstName} ${approver.lastName}` }],
    variables: {
      approverName: `${approver.firstName} ${approver.lastName}`,
      submitterName: `${timesheet.user.firstName} ${timesheet.user.lastName}`,
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      totalHours: timesheet.hours.toString(),
      projectName: timesheet.project?.name || '',
      timesheetUrl: `${baseUrl}/timesheets?status=SUBMITTED`,
    },
  });
}

/**
 * Send timesheet approved email
 */
export async function sendTimesheetApprovedEmail(
  timesheet: {
    id: string;
    date: Date;
    hours: number;
    user: { email: string; firstName: string; lastName: string };
    approvedBy?: { firstName: string; lastName: string } | null;
    approvedAt?: Date | null;
  }
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const weekStart = new Date(timesheet.date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  await sendEmailNotification({
    activityType: EmailActivityType.TIMESHEET_APPROVED,
    recipients: [{ email: timesheet.user.email, name: `${timesheet.user.firstName} ${timesheet.user.lastName}` }],
    variables: {
      userName: `${timesheet.user.firstName} ${timesheet.user.lastName}`,
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      totalHours: timesheet.hours.toString(),
      approvedBy: timesheet.approvedBy ? `${timesheet.approvedBy.firstName} ${timesheet.approvedBy.lastName}` : '',
      approvedAt: timesheet.approvedAt ? formatDate(timesheet.approvedAt, 'long') : '',
      timesheetUrl: `${baseUrl}/timesheets`,
    },
  });
}

/**
 * Send timesheet rejected email
 */
export async function sendTimesheetRejectedEmail(
  timesheet: {
    id: string;
    date: Date;
    hours: number;
    user: { email: string; firstName: string; lastName: string };
    rejectedReason?: string | null;
    approvedBy?: { firstName: string; lastName: string } | null;
  }
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const weekStart = new Date(timesheet.date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  await sendEmailNotification({
    activityType: EmailActivityType.TIMESHEET_REJECTED,
    recipients: [{ email: timesheet.user.email, name: `${timesheet.user.firstName} ${timesheet.user.lastName}` }],
    variables: {
      userName: `${timesheet.user.firstName} ${timesheet.user.lastName}`,
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      totalHours: timesheet.hours.toString(),
      rejectedBy: timesheet.approvedBy ? `${timesheet.approvedBy.firstName} ${timesheet.approvedBy.lastName}` : '',
      rejectionReason: timesheet.rejectedReason || '',
      timesheetUrl: `${baseUrl}/timesheets`,
    },
  });
}

/**
 * Send project status changed email
 */
export async function sendProjectStatusChangedEmail(
  project: {
    id: string;
    name: string;
    status: string;
  },
  oldStatus: string,
  recipients: EmailRecipient[],
  changedBy?: { firstName: string; lastName: string } | null
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.PROJECT_STATUS_CHANGED,
    recipients,
    variables: {
      projectName: project.name,
      oldStatus,
      newStatus: project.status,
      changedBy: changedBy ? `${changedBy.firstName} ${changedBy.lastName}` : '',
      projectUrl: `${baseUrl}/projects/${project.id}`,
    },
  });
}

/**
 * Send task due reminder email
 */
export async function sendTaskDueReminderEmail(
  task: {
    id: string;
    title: string;
    dueDate: Date;
    priority: string;
    project: { id: string; name: string };
  },
  user: { email: string; firstName: string; lastName: string },
  daysRemaining?: number
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.TASK_DUE_REMINDER,
    recipients: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
    variables: {
      userName: `${user.firstName} ${user.lastName}`,
      taskTitle: task.title,
      projectName: task.project.name,
      dueDate: formatDate(task.dueDate, 'long'),
      daysRemaining: daysRemaining?.toString() || '',
      priority: task.priority,
      taskUrl: `${baseUrl}/projects/${task.project.id}?task=${task.id}`,
    },
  });
}

/**
 * Send task overdue email
 */
export async function sendTaskOverdueEmail(
  task: {
    id: string;
    title: string;
    dueDate: Date;
    priority: string;
    project: { id: string; name: string };
  },
  user: { email: string; firstName: string; lastName: string },
  daysOverdue?: number
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.TASK_OVERDUE,
    recipients: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
    variables: {
      userName: `${user.firstName} ${user.lastName}`,
      taskTitle: task.title,
      projectName: task.project.name,
      dueDate: formatDate(task.dueDate, 'long'),
      daysOverdue: daysOverdue?.toString() || '',
      priority: task.priority,
      taskUrl: `${baseUrl}/projects/${task.project.id}?task=${task.id}`,
    },
  });
}

/**
 * Send project health alert email
 */
export async function sendProjectHealthAlertEmail(
  project: {
    id: string;
    name: string;
    code: string;
    healthScore: number | null;
  },
  recipients: EmailRecipient[],
  alertReason?: string
): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  await sendEmailNotification({
    activityType: EmailActivityType.PROJECT_HEALTH_ALERT,
    recipients,
    variables: {
      projectName: project.name,
      projectCode: project.code,
      healthScore: project.healthScore?.toString() || '0',
      healthStatus: project.healthScore && project.healthScore < 50 ? 'Critical' : project.healthScore && project.healthScore < 70 ? 'Warning' : 'Good',
      alertReason: alertReason || '',
      projectUrl: `${baseUrl}/projects/${project.id}`,
    },
  });
}

