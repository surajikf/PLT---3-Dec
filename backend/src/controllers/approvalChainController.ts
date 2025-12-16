/**
 * Approval Chain Controller
 * Handles approval chain CRUD and approval processing
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import {
  getApprovalChain,
  processApprovalRequest,
  createApprovalRequest,
  getPendingApprovalsForUser,
} from '../utils/approvalChains';

export const getApprovalChains = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType } = req.query;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const where: any = {};
    if (entityType) where.entityType = entityType;

    const chains = await prisma.approvalChain.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: chains,
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovalChainById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const chain = await prisma.approvalChain.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!chain) {
      throw new NotFoundError('Approval chain not found');
    }

    res.json({
      success: true,
      data: chain,
    });
  } catch (error) {
    next(error);
  }
};

export const createApprovalChain = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, entityType, steps } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    if (!name || !entityType || !steps || !Array.isArray(steps) || steps.length === 0) {
      throw new ValidationError('Name, entityType, and steps array are required');
    }

    const chain = await prisma.approvalChain.create({
      data: {
        name: name.trim(),
        entityType,
        steps,
        createdById: currentUser.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: chain,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApprovalChain = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, steps, isActive } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const chain = await prisma.approvalChain.findUnique({
      where: { id },
    });

    if (!chain) {
      throw new NotFoundError('Approval chain not found');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (steps !== undefined) updateData.steps = steps;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.approvalChain.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
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

export const getPendingApprovals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    const pending = await getPendingApprovalsForUser(
      currentUser.userId,
      currentUser.role
    );

    res.json({
      success: true,
      data: pending,
    });
  } catch (error) {
    next(error);
  }
};

export const processApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const currentUser = req.user!;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      throw new ValidationError('Action must be APPROVE or REJECT');
    }

    const result = await processApprovalRequest(
      id,
      currentUser.userId,
      action,
      reason
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createApprovalRequestEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { entityType, entityId, metadata } = req.body;
    const currentUser = req.user!;

    if (!entityType || !entityId) {
      throw new ValidationError('entityType and entityId are required');
    }

    const request = await createApprovalRequest(
      entityType,
      entityId,
      currentUser.userId,
      metadata
    );

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};


