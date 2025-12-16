/**
 * Task Dependencies Management
 * Handles task dependency logic and validation
 */

import prisma from './prisma';
import { ValidationError } from './errors';

/**
 * Check for circular dependencies
 */
export async function checkCircularDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<{ hasCycle: boolean; path?: string[] }> {
  // A task cannot depend on itself
  if (taskId === dependsOnTaskId) {
    return { hasCycle: true, path: [taskId] };
  }

  // Check if the target task depends on the current task (direct cycle)
  const directDependency = await prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId: dependsOnTaskId,
        dependsOnTaskId: taskId,
      },
    },
  });

  if (directDependency) {
    return {
      hasCycle: true,
      path: [taskId, dependsOnTaskId, taskId],
    };
  }

  // Check transitive dependencies using DFS
  const visited = new Set<string>();
  const path: string[] = [];

  async function dfs(currentTaskId: string, targetTaskId: string): Promise<boolean> {
    if (currentTaskId === targetTaskId) {
      return true;
    }

    if (visited.has(currentTaskId)) {
      return false;
    }

    visited.add(currentTaskId);
    path.push(currentTaskId);

    // Get all tasks that current task depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId: currentTaskId },
      select: { dependsOnTaskId: true },
    });

    for (const dep of dependencies) {
      if (await dfs(dep.dependsOnTaskId, targetTaskId)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  const hasCycle = await dfs(dependsOnTaskId, taskId);

  return {
    hasCycle,
    path: hasCycle ? [taskId, ...path, taskId] : undefined,
  };
}

/**
 * Get all dependencies for a task (transitive)
 */
export async function getAllDependencies(taskId: string): Promise<string[]> {
  const dependencies = new Set<string>();
  const visited = new Set<string>();

  async function collectDeps(currentTaskId: string) {
    if (visited.has(currentTaskId)) {
      return;
    }

    visited.add(currentTaskId);

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: currentTaskId },
      select: { dependsOnTaskId: true },
    });

    for (const dep of deps) {
      dependencies.add(dep.dependsOnTaskId);
      await collectDeps(dep.dependsOnTaskId);
    }
  }

  await collectDeps(taskId);
  return Array.from(dependencies);
}

/**
 * Get all tasks that depend on this task
 */
export async function getDependentTasks(taskId: string): Promise<string[]> {
  const dependents = new Set<string>();
  const visited = new Set<string>();

  async function collectDependents(currentTaskId: string) {
    if (visited.has(currentTaskId)) {
      return;
    }

    visited.add(currentTaskId);

    const deps = await prisma.taskDependency.findMany({
      where: { dependsOnTaskId: currentTaskId },
      select: { taskId: true },
    });

    for (const dep of deps) {
      dependents.add(dep.taskId);
      await collectDependents(dep.taskId);
    }
  }

  await collectDependents(taskId);
  return Array.from(dependents);
}

/**
 * Check if a task can be started (all dependencies completed)
 */
export async function canStartTask(taskId: string): Promise<{
  canStart: boolean;
  blockingTasks?: Array<{ id: string; title: string; status: string }>;
}> {
  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  const blockingTasks = dependencies
    .filter((dep) => dep.dependsOnTask.status !== 'DONE')
    .map((dep) => ({
      id: dep.dependsOnTask.id,
      title: dep.dependsOnTask.title,
      status: dep.dependsOnTask.status,
    }));

  return {
    canStart: blockingTasks.length === 0,
    blockingTasks: blockingTasks.length > 0 ? blockingTasks : undefined,
  };
}

/**
 * Validate and create task dependency
 */
export async function createTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<void> {
  // Check if tasks exist and are in the same project
  const [task, dependsOnTask] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    }),
    prisma.task.findUnique({
      where: { id: dependsOnTaskId },
      select: { id: true, projectId: true },
    }),
  ]);

  if (!task || !dependsOnTask) {
    throw new ValidationError('One or both tasks not found');
  }

  if (task.projectId !== dependsOnTask.projectId) {
    throw new ValidationError('Tasks must be in the same project');
  }

  // Check for circular dependency
  const cycleCheck = await checkCircularDependency(taskId, dependsOnTaskId);
  if (cycleCheck.hasCycle) {
    throw new ValidationError(
      `Circular dependency detected: ${cycleCheck.path?.join(' -> ')}`
    );
  }

  // Create dependency
  await prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId,
    },
  });
}

/**
 * Calculate task actual hours from linked timesheets
 */
export async function calculateTaskActualHours(taskId: string): Promise<number> {
  const timesheets = await prisma.timesheet.findMany({
    where: {
      taskId,
      status: 'APPROVED',
    },
    select: {
      hours: true,
    },
  });

  return timesheets.reduce((sum, ts) => sum + ts.hours, 0);
}

/**
 * Update task actual hours
 */
export async function updateTaskActualHours(taskId: string): Promise<void> {
  const actualHours = await calculateTaskActualHours(taskId);

  await prisma.task.update({
    where: { id: taskId },
    data: { actualHours },
  });
}


