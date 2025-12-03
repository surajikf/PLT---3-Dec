import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getProjectReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    const currentUser = req.user!;

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get timesheets
    const timesheetWhere: any = {
      projectId: projectId as string,
      status: 'APPROVED',
    };

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
            hourlyRate: true,
          },
        },
      },
    });

    // Calculate statistics
    let totalHours = 0;
    let totalCost = 0;
    const userStats: any = {};

    for (const ts of timesheets) {
      totalHours += ts.hours;
      const cost = ts.user.hourlyRate ? ts.hours * ts.user.hourlyRate : 0;
      totalCost += cost;

      const userId = ts.user.id;
      if (!userStats[userId]) {
        userStats[userId] = {
          user: ts.user,
          hours: 0,
          cost: 0,
        };
      }
      userStats[userId].hours += ts.hours;
      userStats[userId].cost += cost;
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          budget: project.budget,
        },
        summary: {
          totalHours,
          totalCost,
          budgetRemaining: project.budget - totalCost,
          budgetUtilization: project.budget > 0 ? (totalCost / project.budget) * 100 : 0,
        },
        byUser: Object.values(userStats),
        timesheets,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { departmentId, startDate, endDate } = req.query;

    const timesheetWhere: any = {
      status: 'APPROVED',
      user: {
        departmentId: departmentId as string || undefined,
      },
    };

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
            hourlyRate: true,
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
            code: true,
            name: true,
          },
        },
      },
    });

    // Calculate statistics
    const departmentStats: any = {};
    let totalHours = 0;
    let totalCost = 0;

    for (const ts of timesheets) {
      const deptId = ts.user.department?.id || 'unassigned';
      if (!departmentStats[deptId]) {
        departmentStats[deptId] = {
          department: ts.user.department || { id: 'unassigned', name: 'Unassigned' },
          hours: 0,
          cost: 0,
          projects: new Set(),
        };
      }

      const cost = ts.user.hourlyRate ? ts.hours * ts.user.hourlyRate : 0;
      departmentStats[deptId].hours += ts.hours;
      departmentStats[deptId].cost += cost;
      departmentStats[deptId].projects.add(ts.project.id);

      totalHours += ts.hours;
      totalCost += cost;
    }

    // Convert Sets to counts
    Object.values(departmentStats).forEach((stat: any) => {
      stat.projectCount = stat.projects.size;
      delete stat.projects;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalHours,
          totalCost,
        },
        byDepartment: Object.values(departmentStats),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { startDate, endDate } = req.query;

    const projects = await prisma.project.findMany({
      include: {
        timesheets: {
          where: {
            status: 'APPROVED',
            ...(startDate || endDate ? {
              date: {
                ...(startDate ? { gte: new Date(startDate as string) } : {}),
                ...(endDate ? { lte: new Date(endDate as string) } : {}),
              },
            } : {}),
          },
          include: {
            user: {
              select: {
                hourlyRate: true,
              },
            },
          },
        },
      },
    });

    const projectReports = projects.map((project) => {
      let totalCost = 0;
      for (const ts of project.timesheets) {
        if (ts.user.hourlyRate) {
          totalCost += ts.hours * ts.user.hourlyRate;
        }
      }

      return {
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
        },
        budget: project.budget,
        spent: totalCost,
        remaining: project.budget - totalCost,
        utilization: project.budget > 0 ? (totalCost / project.budget) * 100 : 0,
        status: totalCost > project.budget ? 'OVER_BUDGET' : totalCost > project.budget * 0.9 ? 'AT_RISK' : 'HEALTHY',
      };
    });

    const summary = {
      totalBudget: projectReports.reduce((sum, p) => sum + p.budget, 0),
      totalSpent: projectReports.reduce((sum, p) => sum + p.spent, 0),
      totalRemaining: projectReports.reduce((sum, p) => sum + p.remaining, 0),
      overBudgetCount: projectReports.filter((p) => p.status === 'OVER_BUDGET').length,
      atRiskCount: projectReports.filter((p) => p.status === 'AT_RISK').length,
    };

    res.json({
      success: true,
      data: {
        summary,
        projects: projectReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

