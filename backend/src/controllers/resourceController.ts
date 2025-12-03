import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getResources = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, type, search, page = 1, limit = 50 } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'TEAM_MEMBER') {
      // Team members only see resources for their projects
      where.project = {
        members: {
          some: {
            userId: currentUser.userId,
          },
        },
      };
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      // PMs see resources for their managed projects
      where.project = {
        managerId: currentUser.userId,
      };
    } else if (currentUser.role === 'CLIENT') {
      // Clients see resources for their projects
      const customer = await prisma.customer.findFirst({
        where: { email: currentUser.email },
      });
      if (customer) {
        where.project = {
          customerId: customer.id,
        };
      } else {
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
    }

    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          project: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.resource.count({ where }),
    ]);

    res.json({
      success: true,
      data: resources,
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

export const getResourceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, description, type, projectId, url, accessLevel } = req.body;

    const resource = await prisma.resource.create({
      data: {
        name,
        description: description || null,
        type,
        projectId: projectId || null,
        url: url || null,
        accessLevel: accessLevel || 'Team',
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
      },
    });

    res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, description, type, url, accessLevel } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url;
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;

    const resource = await prisma.resource.update({
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
      },
    });

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    await prisma.resource.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

