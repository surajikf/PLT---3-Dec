import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { sanitizeString } from '../utils/sanitize';

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

    // Validate required fields
    if (!name || !name.trim()) {
      throw new ValidationError('Resource name is required');
    }

    // Validate and sanitize name
    const sanitizedName = sanitizeString(name, 200);
    if (sanitizedName.length < 3) {
      throw new ValidationError('Resource name must be at least 3 characters');
    }
    if (sanitizedName.length > 200) {
      throw new ValidationError('Resource name must be less than 200 characters');
    }

    // Validate and sanitize description
    let sanitizedDescription = null;
    if (description) {
      sanitizedDescription = sanitizeString(description, 5000);
      if (sanitizedDescription.length > 5000) {
        throw new ValidationError('Resource description must be less than 5000 characters');
      }
    }

    // Validate URL format if provided
    if (url) {
      try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new ValidationError('URL must use http or https protocol');
        }
        // Check URL length
        if (url.length > 2048) {
          throw new ValidationError('URL is too long (maximum 2048 characters)');
        }
      } catch (error: any) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('Invalid URL format');
      }
    }

    // Validate type
    const validTypes = ['Sitemap Documents', 'Content Folders', 'Design Assets', 'Development Handoff Files', 'QA Checklists', 'Templates', 'Libraries'];
    if (type && !validTypes.includes(type)) {
      throw new ValidationError(`Invalid resource type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate access level
    const validAccessLevels = ['Team', 'Public', 'Restricted'];
    if (accessLevel && !validAccessLevels.includes(accessLevel)) {
      throw new ValidationError(`Invalid access level. Must be one of: ${validAccessLevels.join(', ')}`);
    }

    const resource = await prisma.resource.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        type: type || 'Templates',
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

    // Validate and sanitize name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw new ValidationError('Resource name is required');
      }
      const sanitizedName = sanitizeString(name, 200);
      if (sanitizedName.length < 3) {
        throw new ValidationError('Resource name must be at least 3 characters');
      }
      if (sanitizedName.length > 200) {
        throw new ValidationError('Resource name must be less than 200 characters');
      }
      updateData.name = sanitizedName;
    }

    // Validate and sanitize description if provided
    if (description !== undefined) {
      if (description) {
        const sanitizedDescription = sanitizeString(description, 5000);
        if (sanitizedDescription.length > 5000) {
          throw new ValidationError('Resource description must be less than 5000 characters');
        }
        updateData.description = sanitizedDescription;
      } else {
        updateData.description = null;
      }
    }

    // Validate URL format if provided
    if (url !== undefined && url) {
      try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new ValidationError('URL must use http or https protocol');
        }
        if (url.length > 2048) {
          throw new ValidationError('URL is too long (maximum 2048 characters)');
        }
        updateData.url = url;
      } catch (error: any) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('Invalid URL format');
      }
    } else if (url !== undefined) {
      updateData.url = null;
    }

    // Validate type if provided
    if (type !== undefined) {
      const validTypes = ['Sitemap Documents', 'Content Folders', 'Design Assets', 'Development Handoff Files', 'QA Checklists', 'Templates', 'Libraries'];
      if (type && !validTypes.includes(type)) {
        throw new ValidationError(`Invalid resource type. Must be one of: ${validTypes.join(', ')}`);
      }
      updateData.type = type;
    }

    // Validate access level if provided
    if (accessLevel !== undefined) {
      const validAccessLevels = ['Team', 'Public', 'Restricted'];
      if (accessLevel && !validAccessLevels.includes(accessLevel)) {
        throw new ValidationError(`Invalid access level. Must be one of: ${validAccessLevels.join(', ')}`);
      }
      updateData.accessLevel = accessLevel;
    }

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

