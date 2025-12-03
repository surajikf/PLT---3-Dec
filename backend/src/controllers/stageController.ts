import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getStages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive, type } = req.query;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type) where.type = type;

    const stages = await prisma.stage.findMany({
      where,
      orderBy: { defaultWeight: 'desc' },
    });

    res.json({
      success: true,
      data: stages,
    });
  } catch (error) {
    next(error);
  }
};

export const getStageById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stage = await prisma.stage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projectStages: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundError('Stage not found');
    }

    res.json({
      success: true,
      data: stage,
    });
  } catch (error) {
    next(error);
  }
};

export const createStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, type, defaultWeight, isActive } = req.body;

    const stage = await prisma.stage.create({
      data: {
        name,
        type: type || 'Standard',
        defaultWeight: defaultWeight ? parseFloat(defaultWeight) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      data: stage,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, type, defaultWeight, isActive } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (defaultWeight !== undefined) updateData.defaultWeight = parseFloat(defaultWeight);
    if (isActive !== undefined) updateData.isActive = isActive;

    const stage = await prisma.stage.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: stage,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can delete stages');
    }

    await prisma.stage.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Stage deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

