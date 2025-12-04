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

    // Get all departments with their heads
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    // Get all projects for each department
    const projects = await prisma.project.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Calculate department statistics
    const departmentStats: any = {};

    for (const dept of departments) {
      const deptProjects = projects.filter((p: any) => p.department?.id === dept.id);
      let totalBudget = 0;
      let totalSpent = 0;
      const projectIds = new Set();

      for (const project of deptProjects) {
        totalBudget += project.budget || 0;
        projectIds.add(project.id);

        for (const ts of project.timesheets) {
          if (ts.user.hourlyRate) {
            totalSpent += ts.hours * ts.user.hourlyRate;
          }
        }
      }

      departmentStats[dept.id] = {
        id: dept.id,
        name: dept.name,
        head: dept.head,
        projectCount: projectIds.size,
        totalBudget,
        totalSpent,
      };
    }

    // Handle unassigned projects
    const unassignedProjects = projects.filter((p: any) => !p.department);
    if (unassignedProjects.length > 0) {
      let totalBudget = 0;
      let totalSpent = 0;
      const projectIds = new Set();

      for (const project of unassignedProjects) {
        totalBudget += project.budget || 0;
        projectIds.add(project.id);

        for (const ts of project.timesheets) {
          if (ts.user.hourlyRate) {
            totalSpent += ts.hours * ts.user.hourlyRate;
          }
        }
      }

      departmentStats['unassigned'] = {
        id: 'unassigned',
        name: 'Unassigned',
        head: null,
        projectCount: projectIds.size,
        totalBudget,
        totalSpent,
      };
    }

    res.json({
      success: true,
      data: {
        departments: Object.values(departmentStats),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    const { startDate, endDate } = req.query;

    // Role-based project filtering
    const where: any = {};
    if (currentUser.role === 'PROJECT_MANAGER') {
      where.managerId = currentUser.userId;
    }

    const projects = await prisma.project.findMany({
      where,
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

    const projectReports = projects.map((project: any) => {
      let totalCost = 0;
      for (const ts of project.timesheets) {
        if (ts.user.hourlyRate) {
          totalCost += ts.hours * ts.user.hourlyRate;
        }
      }

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        budget: project.budget || 0,
        totalCost,
        status: project.status,
      };
    });

    const summary = {
      totalBudget: projectReports.reduce((sum: number, p: any) => sum + p.budget, 0),
      totalSpent: projectReports.reduce((sum: number, p: any) => sum + p.totalCost, 0),
      overBudgetCount: projectReports.filter((p: any) => p.totalCost > p.budget).length,
      atRiskCount: projectReports.filter((p: any) => {
        const utilization = p.budget > 0 ? (p.totalCost / p.budget) * 100 : 0;
        return utilization > 90 && utilization <= 100;
      }).length,
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

