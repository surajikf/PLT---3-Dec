/**
 * Resource Capacity Controller
 * Handles resource capacity management
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import {
  getUserCapacity,
  hasCapacity,
  getOverallocationWarnings,
  updateResourceCapacity,
} from '../utils/resourceCapacity';

export const getUserCapacityEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const currentUser = req.user!;

    // Users can view their own capacity, admins can view anyone's
    if (currentUser.userId !== userId && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const capacity = await getUserCapacity(userId, start, end);

    res.json({
      success: true,
      data: capacity,
    });
  } catch (error) {
    next(error);
  }
};

export const checkCapacity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, hours } = req.body;
    const { startDate, endDate } = req.query;
    const currentUser = req.user!;

    if (!userId || !hours) {
      throw new ValidationError('userId and hours are required');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const check = await hasCapacity(userId, Number(hours), start, end);

    res.json({
      success: true,
      data: check,
    });
  } catch (error) {
    next(error);
  }
};

export const getOverallocationWarningsEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const warnings = await getOverallocationWarnings();

    res.json({
      success: true,
      data: warnings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCapacity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { weeklyHours, currentAllocation, startDate, endDate, notes } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    await updateResourceCapacity(userId, {
      weeklyHours,
      currentAllocation,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes,
    });

    const updated = await prisma.resourceCapacity.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

