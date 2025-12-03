import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

/**
 * Calculate profit and loss for a single project
 */
async function calculateProjectProfitLoss(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      code: true,
      budget: true,
      status: true,
    },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Get all APPROVED timesheets for this project
  const timesheets = await prisma.timesheet.findMany({
    where: {
      projectId,
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
          role: true,
        },
      },
    },
  });

  // Calculate costs by employee
  const employeeCosts: Record<string, {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      hourlyRate: number | null;
      role: string;
    };
    totalHours: number;
    totalCost: number;
    timesheetCount: number;
  }> = {};

  let totalActualCost = 0;
  let totalHours = 0;

  for (const ts of timesheets) {
    const hourlyRate = ts.user.hourlyRate || 0;
    const cost = ts.hours * hourlyRate;
    
    totalActualCost += cost;
    totalHours += ts.hours;

    if (!employeeCosts[ts.userId]) {
      employeeCosts[ts.userId] = {
        user: ts.user,
        totalHours: 0,
        totalCost: 0,
        timesheetCount: 0,
      };
    }

    employeeCosts[ts.userId].totalHours += ts.hours;
    employeeCosts[ts.userId].totalCost += cost;
    employeeCosts[ts.userId].timesheetCount += 1;
  }

  const fixedProjectCost = project.budget || 0;
  const profitLoss = fixedProjectCost - totalActualCost;
  const profitLossPercentage = fixedProjectCost > 0 
    ? (profitLoss / fixedProjectCost) * 100 
    : 0;
  const costVariancePercentage = fixedProjectCost > 0
    ? ((totalActualCost / fixedProjectCost) * 100) - 100
    : 0;

  return {
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      status: project.status,
    },
    financials: {
      fixedProjectCost,
      totalActualCost,
      totalHours,
      profitLoss,
      profitLossPercentage,
      costVariancePercentage,
      isProfit: profitLoss > 0,
      isLoss: profitLoss < 0,
      isBreakEven: profitLoss === 0,
    },
    employeeCosts: Object.values(employeeCosts),
    timesheetCount: timesheets.length,
  };
}

/**
 * Get Profit & Loss for a single project (Admin only)
 */
export const getProjectProfitLoss = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Only Super Admin and Admin can access
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied. Only administrators can view profit and loss data.');
    }

    const profitLoss = await calculateProjectProfitLoss(id);

    res.json({
      success: true,
      data: profitLoss,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Profit & Loss for all projects (Admin only)
 */
export const getAllProjectsProfitLoss = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, startDate, endDate, minProfit, maxLoss } = req.query;
    const currentUser = req.user!;

    // Only Super Admin and Admin can access
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied. Only administrators can view profit and loss data.');
    }

    // Get all projects with filters
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        budget: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate P&L for each project
    const projectsWithPL = await Promise.all(
      projects.map(async (project) => {
        const timesheets = await prisma.timesheet.findMany({
          where: {
            projectId: project.id,
            status: 'APPROVED',
          },
          include: {
            user: {
              select: {
                hourlyRate: true,
              },
            },
          },
        });

        let totalActualCost = 0;
        let totalHours = 0;
        for (const ts of timesheets) {
          const hourlyRate = ts.user.hourlyRate || 0;
          totalActualCost += ts.hours * hourlyRate;
          totalHours += ts.hours;
        }

        const fixedProjectCost = project.budget || 0;
        const profitLoss = fixedProjectCost - totalActualCost;
        const profitLossPercentage = fixedProjectCost > 0 
          ? (profitLoss / fixedProjectCost) * 100 
          : 0;

        return {
          ...project,
          financials: {
            fixedProjectCost,
            totalActualCost,
            totalHours,
            profitLoss,
            profitLossPercentage,
            isProfit: profitLoss > 0,
            isLoss: profitLoss < 0,
          },
          timesheetCount: timesheets.length,
        };
      })
    );

    // Apply filters
    let filtered = projectsWithPL;
    if (minProfit) {
      filtered = filtered.filter((p) => p.financials.profitLoss >= Number(minProfit));
    }
    if (maxLoss) {
      filtered = filtered.filter((p) => p.financials.profitLoss >= Number(maxLoss));
    }

    // Calculate summary statistics
    const summary = {
      totalProjects: filtered.length,
      totalFixedCost: filtered.reduce((sum, p) => sum + p.financials.fixedProjectCost, 0),
      totalActualCost: filtered.reduce((sum, p) => sum + p.financials.totalActualCost, 0),
      totalProfitLoss: filtered.reduce((sum, p) => sum + p.financials.profitLoss, 0),
      totalHours: filtered.reduce((sum, p) => sum + p.financials.totalHours, 0),
      profitProjects: filtered.filter((p) => p.financials.isProfit).length,
      lossProjects: filtered.filter((p) => p.financials.isLoss).length,
      breakEvenProjects: filtered.filter((p) => !p.financials.isProfit && !p.financials.isLoss).length,
    };

    res.json({
      success: true,
      data: {
        projects: filtered,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Employee Cost Analysis across all projects (Admin only)
 */
export const getEmployeeCostAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, projectId, startDate, endDate } = req.query;
    const currentUser = req.user!;

    // Only Super Admin and Admin can access
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied. Only administrators can view employee cost analysis.');
    }

    const timesheetWhere: any = {
      status: 'APPROVED',
    };

    if (userId) timesheetWhere.userId = userId;
    if (projectId) timesheetWhere.projectId = projectId;
    if (startDate || endDate) {
      timesheetWhere.date = {};
      if (startDate) timesheetWhere.date.gte = new Date(startDate as string);
      if (endDate) timesheetWhere.date.lte = new Date(endDate as string);
    }

    const timesheets = await prisma.timesheet.findMany({
      where: timesheetWhere,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            hourlyRate: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            budget: true,
          },
        },
      },
    });

    // Group by employee
    const employeeAnalysis: Record<string, {
      user: any;
      totalHours: number;
      totalCost: number;
      projects: Array<{
        project: any;
        hours: number;
        cost: number;
      }>;
      timesheetCount: number;
    }> = {};

    for (const ts of timesheets) {
      const hourlyRate = ts.user.hourlyRate || 0;
      const cost = ts.hours * hourlyRate;

      if (!employeeAnalysis[ts.userId]) {
        employeeAnalysis[ts.userId] = {
          user: ts.user,
          totalHours: 0,
          totalCost: 0,
          projects: [],
          timesheetCount: 0,
        };
      }

      employeeAnalysis[ts.userId].totalHours += ts.hours;
      employeeAnalysis[ts.userId].totalCost += cost;
      employeeAnalysis[ts.userId].timesheetCount += 1;

      // Group by project
      let projectEntry = employeeAnalysis[ts.userId].projects.find(
        (p) => p.project.id === ts.projectId
      );

      if (!projectEntry) {
        projectEntry = {
          project: ts.project,
          hours: 0,
          cost: 0,
        };
        employeeAnalysis[ts.userId].projects.push(projectEntry);
      }

      projectEntry.hours += ts.hours;
      projectEntry.cost += cost;
    }

    // Calculate project profit/loss for each project
    const employeesWithProjectPL = Object.values(employeeAnalysis).map((emp) => ({
      ...emp,
      projects: emp.projects.map((proj) => {
        const projectBudget = proj.project.budget || 0;
        const projectProfitLoss = projectBudget - proj.cost;
        return {
          ...proj,
          projectProfitLoss,
          projectProfitLossPercentage: projectBudget > 0 
            ? (projectProfitLoss / projectBudget) * 100 
            : 0,
        };
      }),
    }));

    res.json({
      success: true,
      data: employeesWithProjectPL.sort((a, b) => b.totalCost - a.totalCost),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Profit & Loss Dashboard Summary (Admin only)
 */
export const getProfitLossDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    // Only Super Admin and Admin can access
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied. Only administrators can view profit and loss dashboard.');
    }

    // Get all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        budget: true,
        status: true,
        createdAt: true,
      },
    });

    // Calculate P&L for all projects
    let totalFixedCost = 0;
    let totalActualCost = 0;
    let totalProfitLoss = 0;
    let totalHours = 0;
    let profitProjects = 0;
    let lossProjects = 0;

    const projectPLs = await Promise.all(
      projects.map(async (project) => {
        const timesheets = await prisma.timesheet.findMany({
          where: {
            projectId: project.id,
            status: 'APPROVED',
          },
          include: {
            user: {
              select: {
                hourlyRate: true,
              },
            },
          },
        });

        let actualCost = 0;
        let hours = 0;
        for (const ts of timesheets) {
          const hourlyRate = ts.user.hourlyRate || 0;
          actualCost += ts.hours * hourlyRate;
          hours += ts.hours;
        }

        const fixedCost = project.budget || 0;
        const profitLoss = fixedCost - actualCost;

        totalFixedCost += fixedCost;
        totalActualCost += actualCost;
        totalProfitLoss += profitLoss;
        totalHours += hours;

        if (profitLoss > 0) profitProjects++;
        else if (profitLoss < 0) lossProjects++;

        return {
          ...project,
          actualCost,
          hours,
          profitLoss,
        };
      })
    );

    // Top profit projects
    const topProfitProjects = projectPLs
      .filter((p) => p.profitLoss > 0)
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 5);

    // Top loss projects
    const topLossProjects = projectPLs
      .filter((p) => p.profitLoss < 0)
      .sort((a, b) => a.profitLoss - b.profitLoss)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalFixedCost,
          totalActualCost,
          totalProfitLoss,
          totalHours,
          totalProjects: projects.length,
          profitProjects,
          lossProjects,
          breakEvenProjects: projects.length - profitProjects - lossProjects,
          profitMargin: totalFixedCost > 0 
            ? (totalProfitLoss / totalFixedCost) * 100 
            : 0,
        },
        topProfitProjects,
        topLossProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

