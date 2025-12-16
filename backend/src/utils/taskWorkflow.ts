/**
 * Task Workflow Management
 * Defines business rules and validation for task operations
 */

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface TaskStatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  allowed: boolean;
  requires?: string[];
  message?: string;
}

/**
 * Valid task status transitions
 */
export const TASK_STATUS_TRANSITIONS: TaskStatusTransition[] = [
  {
    from: TaskStatus.TODO,
    to: TaskStatus.IN_PROGRESS,
    allowed: true,
    requires: ['assignedToId'],
    message: 'Task must be assigned before starting',
  },
  {
    from: TaskStatus.TODO,
    to: TaskStatus.BLOCKED,
    allowed: true,
    requires: [],
    message: 'Task can be marked as blocked',
  },
  {
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.IN_REVIEW,
    allowed: true,
    requires: [],
    message: 'Task can be moved to review',
  },
  {
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.BLOCKED,
    allowed: true,
    requires: [],
    message: 'Task can be blocked',
  },
  {
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.TODO,
    allowed: true,
    requires: [],
    message: 'Task can be moved back to TODO',
  },
  {
    from: TaskStatus.IN_REVIEW,
    to: TaskStatus.DONE,
    allowed: true,
    requires: [],
    message: 'Task can be marked as done',
  },
  {
    from: TaskStatus.IN_REVIEW,
    to: TaskStatus.IN_PROGRESS,
    allowed: true,
    requires: [],
    message: 'Task can be sent back for revision',
  },
  {
    from: TaskStatus.BLOCKED,
    to: TaskStatus.TODO,
    allowed: true,
    requires: [],
    message: 'Blocked task can be unblocked',
  },
  {
    from: TaskStatus.BLOCKED,
    to: TaskStatus.IN_PROGRESS,
    allowed: true,
    requires: [],
    message: 'Blocked task can be resumed',
  },
  {
    from: TaskStatus.DONE,
    to: TaskStatus.IN_PROGRESS,
    allowed: false,
    requires: [],
    message: 'Completed tasks should not be reopened. Create a new task if needed.',
  },
];

/**
 * Check if a task status transition is allowed
 */
export function canTransitionTaskStatus(
  from: TaskStatus,
  to: TaskStatus,
  taskData: any
): { allowed: boolean; message?: string; missingRequirements?: string[] } {
  if (from === to) {
    return { allowed: true };
  }

  const transition = TASK_STATUS_TRANSITIONS.find(
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
  if (transition.requires) {
    const missingRequirements = transition.requires.filter(
      (field) => !taskData[field]
    );

    if (missingRequirements.length > 0) {
      return {
        allowed: false,
        message: transition.message,
        missingRequirements,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validate task data
 */
export function validateTaskData(data: any, isUpdate: boolean = false): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Task title is required');
    } else if (data.title.trim().length < 3) {
      errors.push('Task title must be at least 3 characters');
    } else if (data.title.trim().length > 200) {
      errors.push('Task title must be less than 200 characters');
    }
  }

  if (data.description && data.description.length > 5000) {
    warnings.push('Task description is very long');
  }

  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      warnings.push('Task due date is in the past');
    }
  }

  if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
    errors.push('Invalid task priority');
  }

  if (data.status && !Object.values(TaskStatus).includes(data.status)) {
    errors.push('Invalid task status');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate task completion percentage for a project
 */
export function calculateTaskCompletion(tasks: any[]): {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const inProgress = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW
  ).length;
  const blocked = tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;

  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    inProgress,
    blocked,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(tasks: any[]): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.DONE) return false;

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  });
}

/**
 * Get tasks due soon (within specified days)
 */
export function getTasksDueSoon(tasks: any[], days: number = 7): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  futureDate.setHours(23, 59, 59, 999);

  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.DONE) return false;

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate >= today && dueDate <= futureDate;
  });
}

