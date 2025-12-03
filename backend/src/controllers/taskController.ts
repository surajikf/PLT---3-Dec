import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, assignedToId, status, priority, stageId } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'TEAM_MEMBER') {
      where.OR = [
        { assignedToId: currentUser.userId },
        { project: { members: { some: { userId: currentUser.userId } } } },
      ];
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      where.project = {
        managerId: currentUser.userId,
      };
    }

    if (projectId) where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (stageId) where.stageId = stageId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, assignedToId, title, description, status, priority, dueDate, stageId } = req.body;
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      // Team members can only create tasks for their assigned projects
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      if (currentUser.role === 'TEAM_MEMBER') {
        const isMember = project.members.some((m) => m.userId === currentUser.userId);
        if (!isMember) {
          throw new ForbiddenError('You can only create tasks for assigned projects');
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        assignedToId: assignedToId || null,
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        stageId: stageId || null,
        createdById: currentUser.userId,
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedToId, stageId } = req.body;
    const currentUser = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permissions
    if (currentUser.role === 'TEAM_MEMBER') {
      if (task.assignedToId !== currentUser.userId && task.createdById !== currentUser.userId) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: task.projectId,
              userId: currentUser.userId,
            },
          },
        });
        if (!isMember) {
          throw new ForbiddenError('You can only update your own tasks or tasks in your projects');
        }
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (stageId !== undefined) updateData.stageId = stageId || null;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permissions
    if (currentUser.role === 'TEAM_MEMBER') {
      if (task.createdById !== currentUser.userId) {
        throw new ForbiddenError('You can only delete tasks you created');
      }
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
      });
      if (project?.managerId !== currentUser.userId) {
        throw new ForbiddenError('You can only delete tasks from your projects');
      }
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

