/**
 * Timesheet Workflow Management
 * Defines business rules and validation for timesheet operations
 */

export enum TimesheetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface TimesheetPeriod {
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  approvalDeadline: Date;
}

/**
 * Get current timesheet period (weekly, bi-weekly, or monthly)
 */
export function getCurrentTimesheetPeriod(periodType: 'weekly' | 'biweekly' | 'monthly' = 'weekly'): TimesheetPeriod {
  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  if (periodType === 'weekly') {
    // Week starts on Monday
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, Sunday = 0
    startDate = new Date(today);
    startDate.setDate(today.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (periodType === 'biweekly') {
    // Bi-weekly: every 2 weeks starting from a fixed date
    const epoch = new Date('2024-01-01'); // Starting point
    const daysSinceEpoch = Math.floor((today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
    const weeksSinceEpoch = Math.floor(daysSinceEpoch / 14);
    const periodStartDays = weeksSinceEpoch * 14;
    
    startDate = new Date(epoch);
    startDate.setDate(epoch.getDate() + periodStartDays);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 13);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Monthly: first day to last day of month
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  // Submission deadline: 2 days after period ends
  const submissionDeadline = new Date(endDate);
  submissionDeadline.setDate(endDate.getDate() + 2);
  submissionDeadline.setHours(23, 59, 59, 999);

  // Approval deadline: 5 days after period ends
  const approvalDeadline = new Date(endDate);
  approvalDeadline.setDate(endDate.getDate() + 5);
  approvalDeadline.setHours(23, 59, 59, 999);

  return {
    startDate,
    endDate,
    submissionDeadline,
    approvalDeadline,
  };
}

/**
 * Check if a date is within the current timesheet period
 */
export function isDateInCurrentPeriod(date: Date, periodType: 'weekly' | 'biweekly' | 'monthly' = 'weekly'): boolean {
  const period = getCurrentTimesheetPeriod(periodType);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate >= period.startDate && checkDate <= period.endDate;
}

/**
 * Check if submission deadline has passed
 */
export function isSubmissionDeadlinePassed(periodType: 'weekly' | 'biweekly' | 'monthly' = 'weekly'): boolean {
  const period = getCurrentTimesheetPeriod(periodType);
  return new Date() > period.submissionDeadline;
}

/**
 * Validate timesheet data
 */
export function validateTimesheetData(data: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate date
  if (!data.date) {
    errors.push('Date is required');
  } else {
    const timesheetDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (timesheetDate > today) {
      errors.push('Cannot log time for future dates');
    }
    
    // Check if date is too old (more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (timesheetDate < thirtyDaysAgo) {
      warnings.push('Logging time for a date more than 30 days ago');
    }
  }

  // Validate hours
  if (data.hours === undefined || data.hours === null) {
    errors.push('Hours are required');
  } else {
    const hours = Number(data.hours);
    if (isNaN(hours) || hours <= 0) {
      errors.push('Hours must be greater than 0');
    } else if (hours < 0.5) {
      errors.push('Minimum time entry is 0.5 hours (30 minutes)');
    } else if (hours > 24) {
      errors.push('Cannot log more than 24 hours in a single day');
    } else if (hours > 12) {
      warnings.push('Logging more than 12 hours in a single day');
    }
  }

  // Validate project
  if (!data.projectId) {
    errors.push('Project is required');
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.trim().length < 10) {
    warnings.push('Description is very short. Please provide more details');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if timesheet can be submitted
 */
export function canSubmitTimesheet(timesheet: any): {
  canSubmit: boolean;
  reason?: string;
} {
  if (timesheet.status !== TimesheetStatus.DRAFT) {
    return {
      canSubmit: false,
      reason: 'Only draft timesheets can be submitted',
    };
  }

  const validation = validateTimesheetData(timesheet);
  if (!validation.valid) {
    return {
      canSubmit: false,
      reason: validation.errors.join(', '),
    };
  }

  return { canSubmit: true };
}

/**
 * Check if timesheet can be approved
 */
export function canApproveTimesheet(timesheet: any): {
  canApprove: boolean;
  reason?: string;
} {
  if (timesheet.status !== TimesheetStatus.SUBMITTED) {
    return {
      canApprove: false,
      reason: 'Only submitted timesheets can be approved',
    };
  }

  return { canApprove: true };
}

/**
 * Calculate total hours for a date across all timesheets
 */
export function getTotalHoursForDate(timesheets: any[], date: Date): number {
  const dateStr = date.toISOString().split('T')[0];
  return timesheets
    .filter((ts) => {
      const tsDate = new Date(ts.date).toISOString().split('T')[0];
      return tsDate === dateStr;
    })
    .reduce((sum, ts) => sum + (ts.hours || 0), 0);
}

/**
 * Check for duplicate timesheet entries
 */
export function checkDuplicateTimesheet(
  userId: string,
  projectId: string,
  date: Date,
  existingTimesheets: any[]
): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return existingTimesheets.some((ts) => {
    const tsDate = new Date(ts.date).toISOString().split('T')[0];
    return (
      ts.userId === userId &&
      ts.projectId === projectId &&
      tsDate === dateStr &&
      ts.status !== TimesheetStatus.REJECTED
    );
  });
}

