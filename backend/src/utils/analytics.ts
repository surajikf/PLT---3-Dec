/**
 * Advanced Analytics and Reporting
 * Provides comprehensive insights and metrics
 */

import prisma from './prisma';
import { calculateTaskCompletion, getOverdueTasks, getTasksDueSoon } from './taskWorkflow';
import { calculateProjectHealthScore } from './projectWorkflow';

/**
 * Get project analytics
 */
export async function getProjectAnalytics(projectId: string): Promise<{
  overview: {
    totalHours: number;
    totalCost: number;
    teamSize: number;
    taskCompletion: number;
    healthScore: number;
  };
  timeline: {
    plannedStart: Date | null;
    plannedEnd: Date | null;
    actualStart: Date | null;
    actualEnd: Date | null;
    daysRemaining: number;
    onTrack: boolean;
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
    forecast: number;
  };
  team: {
    members: Array<{
      userId: string;
      name: string;
      hours: number;
      cost: number;
      utilization: number;
    }>;
    topContributors: Array<{
      userId: string;
      name: string;
      hours: number;
    }>;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    overdue: number;
    dueSoon: number;
    completionRate: number;
  };
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
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
      },
      timesheets: {
        where: { status: 'APPROVED' },
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
      },
      tasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Calculate metrics
  const totalHours = project.timesheets.reduce((sum, ts) => sum + ts.hours, 0);
  const totalCost = project.timesheets.reduce(
    (sum, ts) => sum + (ts.hours * (ts.user.hourlyRate || 0)),
    0
  );

  // Team metrics
  const memberMetrics: Record<string, {
    userId: string;
    name: string;
    hours: number;
    cost: number;
  }> = {};

  for (const ts of project.timesheets) {
    const userId = ts.userId;
    if (!memberMetrics[userId]) {
      memberMetrics[userId] = {
        userId,
        name: `${ts.user.firstName} ${ts.user.lastName}`,
        hours: 0,
        cost: 0,
      };
    }
    memberMetrics[userId].hours += ts.hours;
    memberMetrics[userId].cost += ts.hours * (ts.user.hourlyRate || 0);
  }

  const teamMembers = Object.values(memberMetrics).map((m) => ({
    ...m,
    utilization: 0, // Would need capacity data
  }));

  const topContributors = [...teamMembers]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      hours: m.hours,
    }));

  // Task metrics
  const taskMetrics = calculateTaskCompletion(project.tasks);
  const overdue = getOverdueTasks(project.tasks);
  const dueSoon = getTasksDueSoon(project.tasks, 7);

  // Timeline
  const today = new Date();
  const daysRemaining = project.endDate
    ? Math.ceil(
        (new Date(project.endDate).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Budget
  const allocated = project.budget || 0;
  const spent = totalCost;
  const remaining = Math.max(0, allocated - spent);
  const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
  const forecast = totalHours > 0 && project.endDate
    ? (spent / totalHours) * (daysRemaining * 8) // Rough forecast
    : spent;

  // Health score
  const healthScore = calculateProjectHealthScore(project, project.timesheets);

  return {
    overview: {
      totalHours,
      totalCost,
      teamSize: project.members.length,
      taskCompletion: taskMetrics.percentage,
      healthScore,
    },
    timeline: {
      plannedStart: project.startDate,
      plannedEnd: project.endDate,
      actualStart: project.startDate, // Would track actual start
      actualEnd: project.status === 'COMPLETED' ? project.updatedAt : null,
      daysRemaining,
      onTrack: daysRemaining >= 0 && taskMetrics.percentage >= 70,
    },
    budget: {
      allocated,
      spent,
      remaining,
      utilization: Math.round(utilization * 100) / 100,
      forecast: Math.round(forecast * 100) / 100,
    },
    team: {
      members: teamMembers,
      topContributors,
    },
    tasks: {
      total: taskMetrics.total,
      completed: taskMetrics.completed,
      inProgress: taskMetrics.inProgress,
      blocked: taskMetrics.blocked,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      completionRate: taskMetrics.percentage,
    },
  };
}

/**
 * Get organization-wide analytics
 */
export async function getOrganizationAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    averageHealthScore: number;
  };
  timesheets: {
    totalHours: number;
    totalCost: number;
    averageHoursPerDay: number;
    approvalRate: number;
  };
  team: {
    totalMembers: number;
    activeMembers: number;
    averageUtilization: number;
    overallocationCount: number;
  };
  financials: {
    totalBudget: number;
    totalSpent: number;
    totalProfit: number;
    averageProjectMargin: number;
  };
}> {
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  const [
    projects,
    timesheets,
    users,
    allProjects,
  ] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        timesheets: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: { hourlyRate: true },
            },
          },
        },
      },
    }),
    prisma.timesheet.findMany({
      where: {
        status: 'APPROVED',
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        user: {
          select: { hourlyRate: true },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] },
        isActive: true,
      },
    }),
    prisma.project.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        timesheets: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: { hourlyRate: true },
            },
          },
        },
      },
    }),
  ]);

  // Project metrics
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');
  const onHoldProjects = projects.filter((p) => p.status === 'ON_HOLD');

  const healthScores = allProjects
    .map((p) => calculateProjectHealthScore(p, p.timesheets))
    .filter((score) => !isNaN(score));
  const averageHealthScore =
    healthScores.length > 0
      ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
      : 0;

  // Timesheet metrics
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
  const totalCost = timesheets.reduce(
    (sum, ts) => sum + (ts.hours * (ts.user.hourlyRate || 0)),
    0
  );

  const allTimesheets = await prisma.timesheet.findMany({
    where: {
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
  });

  const approvedCount = allTimesheets.filter((ts) => ts.status === 'APPROVED').length;
  const approvalRate =
    allTimesheets.length > 0 ? (approvedCount / allTimesheets.length) * 100 : 0;

  const daysInPeriod = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const averageHoursPerDay = daysInPeriod > 0 ? totalHours / daysInPeriod : 0;

  // Financial metrics
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalProfit = totalBudget - totalCost;
  const projectMargins = projects
    .filter((p) => p.budget > 0)
    .map((p) => {
      const projectCost = p.timesheets.reduce(
        (sum, ts) => sum + (ts.hours * (ts.user.hourlyRate || 0)),
        0
      );
      return ((p.budget - projectCost) / p.budget) * 100;
    });
  const averageProjectMargin =
    projectMargins.length > 0
      ? projectMargins.reduce((sum, m) => sum + m, 0) / projectMargins.length
      : 0;

  return {
    projects: {
      total: projects.length,
      active: activeProjects.length,
      completed: completedProjects.length,
      onHold: onHoldProjects.length,
      averageHealthScore: Math.round(averageHealthScore * 100) / 100,
    },
    timesheets: {
      totalHours: Math.round(totalHours * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      approvalRate: Math.round(approvalRate * 100) / 100,
    },
    team: {
      totalMembers: users.length,
      activeMembers: users.filter((u) => u.isActive).length,
      averageUtilization: 0, // Would need capacity data
      overallocationCount: 0, // Would need capacity data
    },
    financials: {
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpent: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageProjectMargin: Math.round(averageProjectMargin * 100) / 100,
    },
  };
}

