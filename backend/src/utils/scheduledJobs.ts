/**
 * Scheduled Jobs for Automation
 * Handles automated tasks like archiving, reminders, and alerts
 */

import prisma from './prisma';
import { autoArchiveOldProjects, getProjectHealthRecommendations } from './projectAutomation';
import { getCurrentTimesheetPeriod, isSubmissionDeadlinePassed } from './timesheetWorkflow';
import { getOverallocationWarnings } from './resourceCapacity';
// Note: Notification functions are available but not actively used in scheduled jobs
// They can be integrated when notification system is fully implemented

/**
 * Run daily maintenance tasks
 */
export async function runDailyMaintenance(): Promise<{
  archivedProjects: number;
  budgetAlerts: number;
  deadlineAlerts: number;
  overallocationWarnings: number;
}> {
  const results = {
    archivedProjects: 0,
    budgetAlerts: 0,
    deadlineAlerts: 0,
    overallocationWarnings: 0,
  };

  // 1. Auto-archive old completed projects
  results.archivedProjects = await autoArchiveOldProjects(90);

  // 2. Check for budget alerts
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['PLANNING', 'IN_PROGRESS'] },
      isArchived: false,
      budget: { gt: 0 },
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
      manager: {
        select: { id: true },
      },
      members: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
    },
  });

  for (const project of projects) {
    const totalCost = project.timesheets.reduce(
      (sum, ts) => sum + (ts.hours * (ts.user.hourlyRate || 0)),
      0
    );
    const utilization = (totalCost / project.budget) * 100;

    if (utilization >= 80) {
      const userIds = [
        project.managerId,
        ...project.members.map((m: any) => m.userId),
      ].filter(Boolean) as string[];

      if (utilization >= 100) {
        results.budgetAlerts += userIds.length;
      } else if (utilization >= 90) {
        results.budgetAlerts += userIds.length;
      } else if (utilization >= 80) {
        results.budgetAlerts += userIds.length;
      }
    }

    // Check deadlines
    if (project.endDate) {
      const today = new Date();
      const endDate = new Date(project.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining > 0 && daysRemaining <= 7) {
        const userIds = [
          project.managerId,
          ...project.members.map((m: any) => m.userId),
        ].filter(Boolean) as string[];

        results.deadlineAlerts += userIds.length;
      }
    }
  }

  // 3. Check for resource overallocation
  const warnings = await getOverallocationWarnings();
  results.overallocationWarnings = warnings.length;

  return results;
}

/**
 * Check timesheet submission deadlines
 */
export async function checkTimesheetDeadlines(): Promise<{
  overdueSubmissions: number;
  approachingDeadlines: number;
}> {
  const period = getCurrentTimesheetPeriod('weekly');
  const isOverdue = isSubmissionDeadlinePassed('weekly');

  const results = {
    overdueSubmissions: 0,
    approachingDeadlines: 0,
  };

  if (isOverdue) {
    // Find users with unsubmitted timesheets for the period
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] },
        isActive: true,
      },
    });

    for (const user of users) {
      const timesheets = await prisma.timesheet.findMany({
        where: {
          userId: user.id,
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
          status: { in: ['DRAFT'] },
        },
      });

      if (timesheets.length > 0) {
        results.overdueSubmissions++;
      }
    }
  } else {
    // Check if deadline is approaching (within 1 day)
    const deadline = period.submissionDeadline;
    const today = new Date();
    const hoursUntilDeadline =
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] },
          isActive: true,
        },
      });

      for (const user of users) {
        const timesheets = await prisma.timesheet.findMany({
          where: {
            userId: user.id,
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
            status: { in: ['DRAFT'] },
          },
        });

        if (timesheets.length > 0) {
          results.approachingDeadlines++;
        }
      }
    }
  }

  return results;
}

/**
 * Update task actual hours from timesheets
 */
export async function updateTaskActualHours(): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
    },
    select: { id: true },
  });

  let updated = 0;

  for (const task of tasks) {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        taskId: task.id,
        status: 'APPROVED',
      },
      select: { hours: true },
    });

    const actualHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);

    await prisma.task.update({
      where: { id: task.id },
      data: { actualHours },
    });

    updated++;
  }

  return updated;
}

/**
 * Run weekly summary report
 */
export async function generateWeeklySummary(): Promise<{
  activeProjects: number;
  completedProjects: number;
  totalHoursLogged: number;
  totalCost: number;
  pendingApprovals: number;
  overdueTasks: number;
}> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    activeProjects,
    completedProjects,
    timesheets,
    pendingApprovals,
    overdueTasks,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        status: 'IN_PROGRESS',
        isArchived: false,
      },
    }),
    prisma.project.count({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: weekStart },
      },
    }),
    prisma.timesheet.findMany({
      where: {
        date: { gte: weekStart },
        status: 'APPROVED',
      },
      include: {
        user: {
          select: { hourlyRate: true },
        },
      },
    }),
    prisma.approvalRequest.count({
      where: {
        status: 'PENDING',
      },
    }),
    prisma.task.count({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const totalHoursLogged = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
  const totalCost = timesheets.reduce(
    (sum, ts) => sum + (ts.hours * (ts.user.hourlyRate || 0)),
    0
  );

  return {
    activeProjects,
    completedProjects,
    totalHoursLogged,
    totalCost,
    pendingApprovals,
    overdueTasks,
  };
}

