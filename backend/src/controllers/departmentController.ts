import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          head: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    res.json({
      success: true,
      data: departments,
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

export const getDepartmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hourlyRate: true,
          },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, headId } = req.body;

    const department = await prisma.department.create({
      data: {
        name,
        headId: headId || null,
        createdById: currentUser.userId,
      },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, headId } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (headId !== undefined) updateData.headId = headId || null;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can delete departments');
    }

    await prisma.department.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

