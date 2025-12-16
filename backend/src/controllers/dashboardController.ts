import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Get Dashboard Data - Returns all dashboard data in a single request
 * This reduces the number of API calls and database queries
 */
export const getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const { includeUsers } = req.query;

    // Build where clause for projects based on user role
    const projectWhere: any = {
      isArchived: false,
    };

    if (currentUser.role === 'CLIENT') {
      const customer = await prisma.customer.findFirst({
        where: { email: currentUser.email },
      });
      if (customer) {
        projectWhere.customerId = customer.id;
      } else {
        projectWhere.customerId = null; // No projects if no customer found
      }
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      projectWhere.managerId = currentUser.userId;
    } else if (currentUser.role === 'TEAM_MEMBER') {
      projectWhere.members = {
        some: {
          userId: currentUser.userId,
        },
      };
    }

    // Build where clause for timesheets based on user role
    const timesheetWhere: any = {};
    if (currentUser.role === 'TEAM_MEMBER') {
      timesheetWhere.userId = currentUser.userId;
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      timesheetWhere.project = {
        managerId: currentUser.userId,
      };
    }

    // Execute all queries in parallel for better performance
    const [projects, timesheets, users] = await Promise.all([
      // Get projects
      prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          status: true,
          budget: true,
          startDate: true,
          endDate: true,
          healthScore: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
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
          _count: {
            select: {
              members: true,
              timesheets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Get timesheets
      prisma.timesheet.findMany({
        where: timesheetWhere,
        select: {
          id: true,
          userId: true,
          projectId: true,
          date: true,
          hours: true,
          description: true,
          status: true,
          approvedById: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              hourlyRate: true,
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
        orderBy: { date: 'desc' },
        take: 1000, // Limit to prevent huge responses
      }),

      // Get users (only if admin and requested)
      includeUsers === 'true' && ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)
        ? prisma.user.findMany({
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              departmentId: true,
              hourlyRate: true,
              isActive: true,
              createdAt: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        timesheets,
        users: includeUsers === 'true' ? users : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

