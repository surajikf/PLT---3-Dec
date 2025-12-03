import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getTimesheets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, projectId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'TEAM_MEMBER') {
      where.userId = currentUser.userId;
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      // PMs see timesheets for their projects
      where.project = {
        managerId: currentUser.userId,
      };
    }

    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              hourlyRate: true,
            },
          },
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.timesheet.count({ where }),
    ]);

    // Calculate costs
    const timesheetsWithCost = timesheets.map((ts) => ({
      ...ts,
      cost: ts.user.hourlyRate ? ts.hours * ts.user.hourlyRate : 0,
    }));

    res.json({
      success: true,
      data: timesheetsWithCost,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTimesheet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, date, hours, description } = req.body;
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT') {
      throw new ForbiddenError('Clients cannot create timesheets');
    }

    // Validate hours
    if (hours < 0.5 || hours > 24) {
      throw new ValidationError('Hours must be between 0.5 and 24');
    }

    // Validate date (no future dates)
    const entryDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (entryDate > today) {
      throw new ValidationError('Cannot log time for future dates');
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (currentUser.role === 'TEAM_MEMBER') {
      const isMember = project.members.some((m) => m.userId === currentUser.userId);
      if (!isMember) {
        throw new ForbiddenError('You are not assigned to this project');
      }
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        userId: currentUser.userId,
        projectId,
        date: entryDate,
        hours: parseFloat(hours),
        description: description || null,
        status: 'DRAFT',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...timesheet,
        cost: timesheet.user.hourlyRate ? timesheet.hours * timesheet.user.hourlyRate : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimesheet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, hours, description, status } = req.body;
    const currentUser = req.user!;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!timesheet) {
      throw new NotFoundError('Timesheet not found');
    }

    // Check permissions
    if (currentUser.role === 'TEAM_MEMBER') {
      if (timesheet.userId !== currentUser.userId) {
        throw new ForbiddenError('You can only edit your own timesheets');
      }
      if (status && status !== 'SUBMITTED' && status !== 'DRAFT') {
        throw new ForbiddenError('You can only submit or save as draft');
      }
    }

    const updateData: any = {};
    if (date) {
      const entryDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (entryDate > today) {
        throw new ValidationError('Cannot log time for future dates');
      }
      updateData.date = entryDate;
    }
    if (hours !== undefined) {
      if (hours < 0.5 || hours > 24) {
        throw new ValidationError('Hours must be between 0.5 and 24');
      }
      updateData.hours = parseFloat(hours);
    }
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const updated = await prisma.timesheet.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        cost: updated.user.hourlyRate ? updated.hours * updated.user.hourlyRate : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveTimesheet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!timesheet) {
      throw new NotFoundError('Timesheet not found');
    }

    if (currentUser.role === 'PROJECT_MANAGER' && timesheet.project.managerId !== currentUser.userId) {
      throw new ForbiddenError('You can only approve timesheets for your projects');
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new ValidationError('Only submitted timesheets can be approved');
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: currentUser.userId,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        cost: updated.user.hourlyRate ? updated.hours * updated.user.hourlyRate : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectTimesheet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!timesheet) {
      throw new NotFoundError('Timesheet not found');
    }

    if (currentUser.role === 'PROJECT_MANAGER' && timesheet.project.managerId !== currentUser.userId) {
      throw new ForbiddenError('You can only reject timesheets for your projects');
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        cost: updated.user.hourlyRate ? updated.hours * updated.user.hourlyRate : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

