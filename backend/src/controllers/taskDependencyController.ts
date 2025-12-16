/**
 * Task Dependency Controller
 * Handles task dependency operations
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import {
  createTaskDependency,
  getAllDependencies,
  getDependentTasks,
  canStartTask,
  checkCircularDependency,
} from '../utils/taskDependencies';

export const addTaskDependency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { dependsOnTaskId } = req.body;
    const currentUser = req.user!;

    if (!dependsOnTaskId) {
      throw new ValidationError('dependsOnTaskId is required');
    }

    // Check if user has permission to modify the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      if (currentUser.role === 'PROJECT_MANAGER' && task.project.managerId !== currentUser.userId) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    await createTaskDependency(taskId, dependsOnTaskId);

    const dependency = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
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

    res.status(201).json({
      success: true,
      data: dependency,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskDependencies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

    const [dependencies, dependents] = await Promise.all([
      getAllDependencies(taskId),
      getDependentTasks(taskId),
    ]);

    // Get full task details
    const dependencyTasks = await prisma.task.findMany({
      where: {
        id: { in: dependencies },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    const dependentTaskDetails = await prisma.task.findMany({
      where: {
        id: { in: dependents },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    res.json({
      success: true,
      data: {
        dependencies: dependencyTasks,
        dependents: dependentTaskDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkTaskCanStart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

    const check = await canStartTask(taskId);

    res.json({
      success: true,
      data: check,
    });
  } catch (error) {
    next(error);
  }
};

export const removeTaskDependency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId, dependsOnTaskId } = req.params;
    const currentUser = req.user!;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      if (currentUser.role === 'PROJECT_MANAGER' && task.project.managerId !== currentUser.userId) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    await prisma.taskDependency.delete({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Dependency removed successfully',
    });
  } catch (error) {
    next(error);
  }
};


