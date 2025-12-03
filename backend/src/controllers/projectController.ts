import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, managerId, customerId, departmentId, search, page = 1, limit = 50 } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'CLIENT') {
      // Clients only see their projects
      const customer = await prisma.customer.findFirst({
        where: { email: currentUser.email },
      });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      // PMs see their managed projects
      where.managerId = currentUser.userId;
    } else if (currentUser.role === 'TEAM_MEMBER') {
      // Team members see assigned projects
      where.members = {
        some: {
          userId: currentUser.userId,
        },
      };
    }

    if (status) where.status = status;
    if (managerId) where.managerId = managerId;
    if (customerId) where.customerId = customerId;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              timesheets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
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

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
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
          },
        },
        stages: {
          include: {
            stage: true,
          },
          orderBy: {
            stage: {
              defaultWeight: 'desc',
            },
          },
        },
        resources: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check access permissions
    if (currentUser.role === 'CLIENT') {
      const customer = await prisma.customer.findFirst({
        where: { email: currentUser.email },
      });
      if (!customer || project.customerId !== customer.id) {
        throw new ForbiddenError('Access denied');
      }
    } else if (currentUser.role === 'PROJECT_MANAGER' && project.managerId !== currentUser.userId) {
      throw new ForbiddenError('Access denied');
    } else if (currentUser.role === 'TEAM_MEMBER') {
      const isMember = project.members.some((m) => m.userId === currentUser.userId);
      if (!isMember) {
        throw new ForbiddenError('Access denied');
      }
    }

    // Calculate project health and progress
    const timesheets = await prisma.timesheet.findMany({
      where: {
        projectId: id,
        status: 'APPROVED',
      },
    });

    let totalCost = 0;
    for (const timesheet of timesheets) {
      const user = await prisma.user.findUnique({
        where: { id: timesheet.userId },
        select: { hourlyRate: true },
      });
      if (user?.hourlyRate) {
        totalCost += timesheet.hours * user.hourlyRate;
      }
    }

    const progress = project.stages
      .filter((ps) => ps.status === 'CLOSED')
      .reduce((sum, ps) => sum + ps.weight, 0);

    const healthScore = calculateHealthScore(project.budget, totalCost, progress);

    res.json({
      success: true,
      data: {
        ...project,
        calculatedProgress: progress,
        totalCost,
        healthScore: healthScore || project.healthScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, name, description, customerId, managerId, departmentId, budget, startDate, endDate, stageIds } = req.body;
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions to create projects');
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        code,
        name,
        description,
        customerId: customerId || null,
        managerId: managerId || null,
        departmentId: departmentId || null,
        budget: budget ? parseFloat(budget) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: currentUser.userId,
      },
    });

    // Add stages if provided
    if (stageIds && Array.isArray(stageIds)) {
      for (const stageId of stageIds) {
        const stage = await prisma.stage.findUnique({ where: { id: stageId } });
        if (stage) {
          await prisma.projectStage.create({
            data: {
              projectId: project.id,
              stageId: stage.id,
              weight: stage.defaultWeight,
            },
          });
        }
      }
    }

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        customer: true,
        manager: true,
        department: true,
        stages: {
          include: {
            stage: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: fullProject,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const updateData: any = {};

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      if (currentUser.role === 'PROJECT_MANAGER' && project.managerId !== currentUser.userId) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    const allowedFields = ['name', 'description', 'status', 'budget', 'startDate', 'endDate', 'managerId', 'departmentId', 'healthScore'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'budget' || field === 'healthScore') {
          updateData[field] = parseFloat(req.body[field]);
        } else if (field === 'startDate' || field === 'endDate') {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        manager: true,
        department: true,
      },
    });

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const assignMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const currentUser = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      if (currentUser.role === 'PROJECT_MANAGER' && project.managerId !== currentUser.userId) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    // Remove existing members
    await prisma.projectMember.deleteMany({
      where: { projectId: id },
    });

    // Add new members
    if (userIds && Array.isArray(userIds)) {
      await prisma.projectMember.createMany({
        data: userIds.map((userId: string) => ({
          projectId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

function calculateHealthScore(budget: number, totalCost: number, progress: number): number {
  const budgetHealth = budget > 0 ? Math.max(0, 100 - (totalCost / budget) * 100) : 100;
  const progressHealth = progress;
  return Math.round((budgetHealth + progressHealth) / 2);
}

