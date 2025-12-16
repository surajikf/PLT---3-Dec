/**
 * Project Workflow Management
 * Defines logical status transitions and business rules for projects
 */

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProjectStatusTransition {
  from: ProjectStatus;
  to: ProjectStatus;
  allowed: boolean;
  requires: string[];
  message?: string;
}

/**
 * Valid project status transitions with business rules
 */
export const PROJECT_STATUS_TRANSITIONS: ProjectStatusTransition[] = [
  {
    from: ProjectStatus.PLANNING,
    to: ProjectStatus.IN_PROGRESS,
    allowed: true,
    requires: ['managerId', 'startDate'],
    message: 'Project must have a manager and start date before starting',
  },
  {
    from: ProjectStatus.PLANNING,
    to: ProjectStatus.CANCELLED,
    allowed: true,
    requires: [],
    message: 'Project can be cancelled during planning',
  },
  {
    from: ProjectStatus.IN_PROGRESS,
    to: ProjectStatus.ON_HOLD,
    allowed: true,
    requires: [],
    message: 'Project can be put on hold',
  },
  {
    from: ProjectStatus.IN_PROGRESS,
    to: ProjectStatus.COMPLETED,
    allowed: true,
    requires: ['endDate'],
    message: 'Project must have an end date before completion',
  },
  {
    from: ProjectStatus.IN_PROGRESS,
    to: ProjectStatus.CANCELLED,
    allowed: true,
    requires: [],
    message: 'Project can be cancelled',
  },
  {
    from: ProjectStatus.ON_HOLD,
    to: ProjectStatus.IN_PROGRESS,
    allowed: true,
    requires: [],
    message: 'Project can be resumed from hold',
  },
  {
    from: ProjectStatus.ON_HOLD,
    to: ProjectStatus.CANCELLED,
    allowed: true,
    requires: [],
    message: 'Project on hold can be cancelled',
  },
  {
    from: ProjectStatus.COMPLETED,
    to: ProjectStatus.IN_PROGRESS,
    allowed: false,
    requires: [],
    message: 'Completed projects cannot be reopened',
  },
  {
    from: ProjectStatus.CANCELLED,
    to: ProjectStatus.IN_PROGRESS,
    allowed: false,
    requires: [],
    message: 'Cancelled projects cannot be reopened',
  },
];

/**
 * Check if a status transition is allowed
 */
export function canTransitionStatus(
  from: ProjectStatus,
  to: ProjectStatus,
  projectData: any
): { allowed: boolean; message?: string; missingRequirements?: string[] } {
  if (from === to) {
    return { allowed: true };
  }

  const transition = PROJECT_STATUS_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return {
      allowed: false,
      message: `Invalid status transition from ${from} to ${to}`,
    };
  }

  if (!transition.allowed) {
    return {
      allowed: false,
      message: transition.message || 'This transition is not allowed',
    };
  }

  // Check required fields
  const missingRequirements = transition.requires.filter(
    (field) => !projectData[field]
  );

  if (missingRequirements.length > 0) {
    return {
      allowed: false,
      message: transition.message,
      missingRequirements,
    };
  }

  return { allowed: true };
}

/**
 * Calculate project health score based on multiple factors
 */
export function calculateProjectHealthScore(project: any, timesheets: any[]): number {
  let score = 100;
  const factors: { name: string; impact: number }[] = [];

  // Factor 1: Budget utilization (0-30 points)
  if (project.budget > 0) {
    const totalCost = timesheets
      .filter((ts) => ts.status === 'APPROVED')
      .reduce((sum, ts) => {
        const hourlyRate = ts.user?.hourlyRate || 0;
        return sum + ts.hours * hourlyRate;
      }, 0);
    
    const budgetUtilization = (totalCost / project.budget) * 100;
    
    if (budgetUtilization > 100) {
      const overBudget = budgetUtilization - 100;
      score -= Math.min(30, overBudget * 0.3);
      factors.push({ name: 'Over Budget', impact: -Math.min(30, overBudget * 0.3) });
    } else if (budgetUtilization > 90) {
      score -= 10;
      factors.push({ name: 'Near Budget Limit', impact: -10 });
    } else if (budgetUtilization > 80) {
      score -= 5;
      factors.push({ name: 'High Budget Usage', impact: -5 });
    }
  }

  // Factor 2: Timeline adherence (0-25 points)
  if (project.endDate) {
    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = project.startDate
      ? Math.ceil((endDate.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const progress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;
    
    if (daysRemaining < 0) {
      score -= 25;
      factors.push({ name: 'Past Deadline', impact: -25 });
    } else if (daysRemaining < 7 && progress < 90) {
      score -= 15;
      factors.push({ name: 'Approaching Deadline', impact: -15 });
    }
  }

  // Factor 3: Timesheet submission rate (0-20 points)
  if (timesheets.length > 0) {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentTimesheets = timesheets.filter(
      (ts) => new Date(ts.date) >= lastWeek
    );
    const approvedRate = timesheets.filter((ts) => ts.status === 'APPROVED').length / timesheets.length;
    
    if (approvedRate < 0.7) {
      score -= 20;
      factors.push({ name: 'Low Approval Rate', impact: -20 });
    } else if (approvedRate < 0.85) {
      score -= 10;
      factors.push({ name: 'Moderate Approval Rate', impact: -10 });
    }
  }

  // Factor 4: Team member activity (0-15 points)
  if (project.members && project.members.length > 0) {
    const activeMembers = timesheets
      .filter((ts) => {
        const tsDate = new Date(ts.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tsDate >= weekAgo;
      })
      .map((ts) => ts.userId)
      .filter((id, index, self) => self.indexOf(id) === index);
    
    const activityRate = activeMembers.length / project.members.length;
    
    if (activityRate < 0.5) {
      score -= 15;
      factors.push({ name: 'Low Team Activity', impact: -15 });
    } else if (activityRate < 0.7) {
      score -= 8;
      factors.push({ name: 'Moderate Team Activity', impact: -8 });
    }
  }

  // Factor 5: Status-based adjustments (0-10 points)
  if (project.status === 'ON_HOLD') {
    score -= 10;
    factors.push({ name: 'Project On Hold', impact: -10 });
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Validate project data before creation/update
 */
export function validateProjectData(data: any, isUpdate: boolean = false): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isUpdate || data.code !== undefined) {
    if (!data.code || data.code.trim().length === 0) {
      errors.push('Project code is required');
    } else if (!/^[A-Z0-9-_]+$/.test(data.code)) {
      errors.push('Project code must contain only uppercase letters, numbers, hyphens, and underscores');
    }
  }

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Project name is required');
    } else if (data.name.trim().length < 3) {
      errors.push('Project name must be at least 3 characters');
    } else if (data.name.trim().length > 200) {
      errors.push('Project name must be less than 200 characters');
    }
  }
  
  // Validate description max length
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description === 'string' && data.description.length > 5000) {
      errors.push('Project description must be less than 5000 characters');
    }
  }

  if (data.budget !== undefined) {
    if (data.budget < 0) {
      errors.push('Budget cannot be negative');
    }
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

