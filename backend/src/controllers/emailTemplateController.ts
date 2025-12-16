/**
 * Email Template Controller
 * Handles email template CRUD operations
 */

import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getEmailTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const { category, isActive } = req.query;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.emailTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

export const getEmailTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
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

    if (!template) {
      throw new NotFoundError('Email template not found');
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, subject, body, bodyHtml, category, variables, isActive } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Validation
    if (!name || !name.trim()) {
      throw new ValidationError('Template name is required');
    }
    if (!subject || !subject.trim()) {
      throw new ValidationError('Subject is required');
    }
    if (!body || !body.trim()) {
      throw new ValidationError('Email body is required');
    }
    if (!category || !category.trim()) {
      throw new ValidationError('Category is required');
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        bodyHtml: bodyHtml?.trim() || null,
        category: category.trim(),
        variables: variables || null,
        isActive: isActive !== undefined ? isActive : true,
        createdById: currentUser.userId,
      },
      include: {
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

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, subject, body, bodyHtml, category, variables, isActive } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Email template not found');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (subject !== undefined) updateData.subject = subject.trim();
    if (body !== undefined) updateData.body = body.trim();
    if (bodyHtml !== undefined) updateData.bodyHtml = bodyHtml?.trim() || null;
    if (category !== undefined) updateData.category = category.trim();
    if (variables !== undefined) updateData.variables = variables;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
      include: {
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

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Email template not found');
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Email template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendTestEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { to, variables } = req.body;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Email template not found');
    }

    if (!to || !to.trim()) {
      throw new ValidationError('Recipient email is required');
    }

    const { sendTemplatedEmail } = await import('../utils/emailService');
    
    await sendTemplatedEmail(
      to.trim(),
      template.subject,
      template.body,
      template.bodyHtml || undefined,
      variables || {}
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};


