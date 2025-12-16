/**
 * Project Template Controller
 * Handles project template CRUD operations
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { validateTemplateData, createProjectFromTemplate } from '../utils/projectTemplates';

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const templates = await prisma.projectTemplate.findMany({
      where: {
        isActive: true,
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.projectTemplate.findUnique({
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

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, stages, defaultBudget, defaultDuration } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const validation = validateTemplateData({
      name,
      stages,
      defaultBudget,
      defaultDuration,
    });

    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    const template = await prisma.projectTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        stages: stages || [],
        defaultBudget: defaultBudget || null,
        defaultDuration: defaultDuration || null,
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
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createProjectFromTemplateEndpoint = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const project = await createProjectFromTemplate(
      req.body,
      currentUser.userId
    );

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, stages, defaultBudget, defaultDuration, isActive } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.projectTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (stages !== undefined) updateData.stages = stages;
    if (defaultBudget !== undefined) updateData.defaultBudget = defaultBudget;
    if (defaultDuration !== undefined) updateData.defaultDuration = defaultDuration;
    if (isActive !== undefined) updateData.isActive = isActive;

    const validation = validateTemplateData({
      name: updateData.name || template.name,
      stages: updateData.stages || (template.stages as any),
      defaultBudget: updateData.defaultBudget !== undefined ? updateData.defaultBudget : template.defaultBudget,
      defaultDuration: updateData.defaultDuration !== undefined ? updateData.defaultDuration : template.defaultDuration,
    });

    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    const updated = await prisma.projectTemplate.update({
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

export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.projectTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    await prisma.projectTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

