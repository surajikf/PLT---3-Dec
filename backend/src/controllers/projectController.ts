import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { validateProjectCode, validateBudget, validateDateRange } from '../utils/validation';

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, managerId, customerId, departmentId, search, page = 1, limit = 50, includeArchived } = req.query;
    const currentUser = req.user!;

    const where: any = {};

    // Archive filter - build this first
    // Default: exclude archived projects (show only active ones)
    if (includeArchived === 'archived') {
      // Show only archived projects
      where.isArchived = true;
    } else if (includeArchived !== 'true') {
      // Default: exclude archived projects
      // For MySQL: filter by false (null values will be excluded since default is false)
      where.isArchived = false;
    }
    // If includeArchived === 'true', don't filter by archive status

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

    // Additional filters
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;
    if (customerId) where.customerId = customerId;
    if (departmentId) where.departmentId = departmentId;
    
    // Handle search
    if (search) {
      const searchOR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
      
      // If we have other conditions, combine search with AND
      if (Object.keys(where).length > 1 || (where.OR && where.OR.length > 0)) {
        // We have other filters, need to use AND
        const otherConditions = { ...where };
        delete otherConditions.OR;
        
        where.AND = [];
        if (Object.keys(otherConditions).length > 0) {
          where.AND.push(otherConditions);
        }
        where.AND.push({ OR: searchOR });
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    // Use where directly - it already has all filters including archive filter
    const finalWhere = where;

    const skip = (Number(page) - 1) * Number(limit);

    // Include members relation for employees to enable frontend filtering
    const includeMembers = currentUser.role === 'TEAM_MEMBER';
    
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: finalWhere,
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
          ...(includeMembers && {
            members: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          }),
          _count: {
            select: {
              members: true,
              timesheets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where: finalWhere }),
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
  } catch (error: any) {
    console.error('❌ Error in getProjects:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) {
      console.error('Error code:', error.code);
    }
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
                role: true,
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
    });

    let totalCost = 0;
    const employeeCosts: Record<string, {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        hourlyRate: number | null;
      };
      totalHours: number;
      totalCost: number;
    }> = {};

    for (const timesheet of timesheets) {
      const hourlyRate = timesheet.user.hourlyRate || 0;
      const cost = timesheet.hours * hourlyRate;
      totalCost += cost;

      if (!employeeCosts[timesheet.userId]) {
        employeeCosts[timesheet.userId] = {
          user: timesheet.user,
          totalHours: 0,
          totalCost: 0,
        };
      }
      employeeCosts[timesheet.userId].totalHours += timesheet.hours;
      employeeCosts[timesheet.userId].totalCost += cost;
    }

    const progress = project.stages
      .filter((ps: any) => ps.status === 'CLOSED')
      .reduce((sum: number, ps: any) => sum + ps.weight, 0);

    const healthScore = calculateHealthScore(project.budget, totalCost, progress);

    // Calculate profit/loss for admin users
    const fixedProjectCost = project.budget || 0;
    const profitLoss = fixedProjectCost - totalCost;
    const profitLossPercentage = fixedProjectCost > 0 
      ? (profitLoss / fixedProjectCost) * 100 
      : 0;

    const responseData: any = {
      ...project,
      calculatedProgress: progress,
      totalCost,
      healthScore: healthScore || project.healthScore,
    };

    // Add detailed cost breakdown for admin users only
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      responseData.employeeCosts = Object.values(employeeCosts);
      responseData.financials = {
        fixedProjectCost,
        totalActualCost: totalCost,
        profitLoss,
        profitLossPercentage,
        isProfit: profitLoss > 0,
        isLoss: profitLoss < 0,
        isBreakEven: profitLoss === 0,
      };
    }

    res.json({
      success: true,
      data: responseData,
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

    // Validate required fields
    if (!code || !code.trim()) {
      throw new ValidationError('Project code is required');
    }
    if (!name || !name.trim()) {
      throw new ValidationError('Project name is required');
    }

    // Validate project code format
    validateProjectCode(code.trim());

    // Check if code already exists
    const existingProject = await prisma.project.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existingProject) {
      throw new ValidationError('Project code already exists. Please use a different code.');
    }

    // Validate budget
    const validatedBudget = validateBudget(budget);

    // Validate dates
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    validateDateRange(start, end);

    // Validate customer exists if provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new ValidationError('Selected customer does not exist');
      }
    }

    // Validate manager exists if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager) {
        throw new ValidationError('Selected manager does not exist');
      }
      if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(manager.role)) {
        throw new ValidationError('Selected user is not eligible to be a project manager');
      }
    }

    // Validate department exists if provided
    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) {
        throw new ValidationError('Selected department does not exist');
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        customerId: customerId || null,
        managerId: managerId || null,
        departmentId: departmentId || null,
        budget: validatedBudget,
        startDate: start,
        endDate: end,
        createdById: currentUser.userId,
        status: 'PLANNING', // Always start in PLANNING status
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

export const updateProjectStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, projectStageId } = req.params;
    const { status } = req.body;
    const currentUser = req.user!;

    // Validate status
    const validStatuses = ['OFF', 'ON', 'IN_PROGRESS', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid stage status');
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // Update project stage
    const updateData: any = {
      status,
    };

    // Set completed date if closing the stage
    if (status === 'CLOSED') {
      updateData.completedDate = new Date();
    } else {
      updateData.completedDate = null;
    }

    const updatedStage = await prisma.projectStage.update({
      where: { id: projectStageId },
      data: updateData,
      include: {
        stage: true,
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
      data: updatedStage,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateProjectStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('Project IDs array is required');
    }

    if (!status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Get projects to check permissions
    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
    });

    if (projects.length === 0) {
      throw new ValidationError('No projects found');
    }

    // Filter by permissions for PROJECT_MANAGER
    const projectsToUpdate = projects.filter((p) => {
      if (currentUser.role === 'PROJECT_MANAGER') {
        return p.managerId === currentUser.userId;
      }
      return true;
    });

    if (projectsToUpdate.length === 0) {
      throw new ForbiddenError('No projects available for update');
    }

    const result = await prisma.project.updateMany({
      where: {
        id: { in: projectsToUpdate.map((p) => p.id) },
      },
      data: { status },
    });

    res.json({
      success: true,
      data: {
        updated: result.count,
        total: projectsToUpdate.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('Project IDs array is required');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Soft delete: Archive projects instead of hard delete
    const result = await prisma.project.updateMany({
      where: { id: { in: ids } },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        archived: result.count,
        total: ids.length,
      },
      message: `${result.count} project(s) archived successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkRestoreProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('Project IDs array is required');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Restore archived projects
    const result = await prisma.project.updateMany({
      where: { id: { in: ids }, isArchived: true },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        restored: result.count,
        total: ids.length,
      },
      message: `${result.count} project(s) restored successfully`,
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

