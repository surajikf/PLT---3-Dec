/**
 * Analytics Controller
 * Provides comprehensive reporting and analytics endpoints
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { getProjectAnalytics, getOrganizationAnalytics } from '../utils/analytics';

export const getProjectAnalyticsEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Check permissions
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const analytics = await getProjectAnalytics(id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationAnalyticsEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analytics = await getOrganizationAnalytics(start, end);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

