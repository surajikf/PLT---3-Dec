/**
 * Notification System
 * Handles business logic notifications and alerts
 */

export enum NotificationType {
  TIMESHEET_SUBMITTED = 'TIMESHEET_SUBMITTED',
  TIMESHEET_APPROVED = 'TIMESHEET_APPROVED',
  TIMESHEET_REJECTED = 'TIMESHEET_REJECTED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  PROJECT_BUDGET_ALERT = 'PROJECT_BUDGET_ALERT',
  PROJECT_DEADLINE_APPROACHING = 'PROJECT_DEADLINE_APPROACHING',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  MEMBER_ADDED_TO_PROJECT = 'MEMBER_ADDED_TO_PROJECT',
}

export interface Notification {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Create notification for timesheet submission
 */
export function createTimesheetSubmittedNotification(
  timesheet: any,
  projectManagerId: string
): Notification {
  return {
    type: NotificationType.TIMESHEET_SUBMITTED,
    userId: projectManagerId,
    title: 'New Timesheet Submitted',
    message: `${timesheet.user.firstName} ${timesheet.user.lastName} submitted ${timesheet.hours}h for ${timesheet.project.name}`,
    link: `/timesheets?status=SUBMITTED`,
    metadata: {
      timesheetId: timesheet.id,
      projectId: timesheet.projectId,
      userId: timesheet.userId,
    },
    createdAt: new Date(),
  };
}

/**
 * Create notification for timesheet approval
 */
export function createTimesheetApprovedNotification(
  timesheet: any
): Notification {
  return {
    type: NotificationType.TIMESHEET_APPROVED,
    userId: timesheet.userId,
    title: 'Timesheet Approved',
    message: `Your timesheet for ${timesheet.project.name} has been approved`,
    link: `/timesheets`,
    metadata: {
      timesheetId: timesheet.id,
      projectId: timesheet.projectId,
    },
    createdAt: new Date(),
  };
}

/**
 * Create notification for timesheet rejection
 */
export function createTimesheetRejectedNotification(
  timesheet: any,
  reason?: string
): Notification {
  return {
    type: NotificationType.TIMESHEET_REJECTED,
    userId: timesheet.userId,
    title: 'Timesheet Rejected',
    message: `Your timesheet for ${timesheet.project.name} was rejected${reason ? `: ${reason}` : ''}`,
    link: `/timesheets`,
    metadata: {
      timesheetId: timesheet.id,
      projectId: timesheet.projectId,
      reason,
    },
    createdAt: new Date(),
  };
}

/**
 * Create notification for project status change
 */
export function createProjectStatusChangeNotification(
  project: any,
  oldStatus: string,
  newStatus: string,
  userIds: string[]
): Notification[] {
  return userIds.map((userId) => ({
    type: NotificationType.PROJECT_STATUS_CHANGED,
    userId,
    title: 'Project Status Changed',
    message: `Project ${project.name} status changed from ${oldStatus} to ${newStatus}`,
    link: `/projects/${project.id}`,
    metadata: {
      projectId: project.id,
      oldStatus,
      newStatus,
    },
    createdAt: new Date(),
  }));
}

/**
 * Create notification for budget alert
 */
export function createBudgetAlertNotification(
  project: any,
  budgetUtilization: number,
  userIds: string[]
): Notification[] {
  let message = '';
  if (budgetUtilization >= 100) {
    message = `Project ${project.name} has exceeded its budget`;
  } else if (budgetUtilization >= 90) {
    message = `Project ${project.name} has used ${budgetUtilization.toFixed(1)}% of its budget`;
  } else if (budgetUtilization >= 80) {
    message = `Project ${project.name} has used ${budgetUtilization.toFixed(1)}% of its budget`;
  }

  return userIds.map((userId) => ({
    type: NotificationType.PROJECT_BUDGET_ALERT,
    userId,
    title: 'Budget Alert',
    message,
    link: `/projects/${project.id}`,
    metadata: {
      projectId: project.id,
      budgetUtilization,
      budget: project.budget,
    },
    createdAt: new Date(),
  }));
}

/**
 * Create notification for deadline approaching
 */
export function createDeadlineApproachingNotification(
  project: any,
  daysRemaining: number,
  userIds: string[]
): Notification[] {
  return userIds.map((userId) => ({
    type: NotificationType.PROJECT_DEADLINE_APPROACHING,
    userId,
    title: 'Deadline Approaching',
    message: `Project ${project.name} deadline is in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
    link: `/projects/${project.id}`,
    metadata: {
      projectId: project.id,
      daysRemaining,
      endDate: project.endDate,
    },
    createdAt: new Date(),
  }));
}

/**
 * Check if project needs budget alert
 */
export function shouldSendBudgetAlert(budgetUtilization: number): boolean {
  return budgetUtilization >= 80; // Alert at 80%, 90%, and 100%
}

/**
 * Check if project needs deadline alert
 */
export function shouldSendDeadlineAlert(endDate: Date | null, daysThreshold: number = 7): {
  shouldAlert: boolean;
  daysRemaining: number;
} {
  if (!endDate) {
    return { shouldAlert: false, daysRemaining: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(endDate);
  deadline.setHours(23, 59, 59, 999);

  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    shouldAlert: daysRemaining > 0 && daysRemaining <= daysThreshold,
    daysRemaining,
  };
}


