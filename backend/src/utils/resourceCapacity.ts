/**
 * Resource Capacity Management
 * Tracks and manages team member availability and allocation
 */

import prisma from './prisma';
import { ValidationError } from './errors';

/**
 * Get user's current capacity and allocation
 */
export async function getUserCapacity(userId: string, startDate?: Date, endDate?: Date): Promise<{
  weeklyHours: number;
  currentAllocation: number;
  availableHours: number;
  utilization: number;
  projects: Array<{ id: string; name: string; allocatedHours: number }>;
}> {
  const capacity = await prisma.resourceCapacity.findUnique({
    where: { userId },
  });

  if (!capacity) {
    // Return default capacity if not set
    return {
      weeklyHours: 40,
      currentAllocation: 0,
      availableHours: 40,
      utilization: 0,
      projects: [],
    };
  }

  // Calculate current allocation from approved timesheets
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      status: 'APPROVED',
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by project
  const projectAllocation: Record<string, { name: string; hours: number }> = {};
  let totalAllocation = 0;

  for (const ts of timesheets) {
    const projectId = ts.projectId;
    if (!projectAllocation[projectId]) {
      projectAllocation[projectId] = {
        name: ts.project.name,
        hours: 0,
      };
    }
    projectAllocation[projectId].hours += ts.hours;
    totalAllocation += ts.hours;
  }

  const projects = Object.entries(projectAllocation).map(([id, data]) => ({
    id,
    name: data.name,
    allocatedHours: data.hours,
  }));

  const weeklyHours = capacity.weeklyHours;
  const availableHours = Math.max(0, weeklyHours - totalAllocation);
  const utilization = weeklyHours > 0 ? (totalAllocation / weeklyHours) * 100 : 0;

  return {
    weeklyHours,
    currentAllocation: totalAllocation,
    availableHours,
    utilization: Math.round(utilization * 100) / 100,
    projects,
  };
}

/**
 * Check if user has capacity for additional hours
 */
export async function hasCapacity(
  userId: string,
  requestedHours: number,
  periodStart?: Date,
  periodEnd?: Date
): Promise<{
  hasCapacity: boolean;
  availableHours: number;
  message?: string;
}> {
  const capacity = await getUserCapacity(userId, periodStart, periodEnd);

  if (capacity.availableHours >= requestedHours) {
    return {
      hasCapacity: true,
      availableHours: capacity.availableHours,
    };
  }

  return {
    hasCapacity: false,
    availableHours: capacity.availableHours,
    message: `Insufficient capacity. Available: ${capacity.availableHours}h, Requested: ${requestedHours}h`,
  };
}

/**
 * Get overallocation warnings
 */
export async function getOverallocationWarnings(): Promise<Array<{
  userId: string;
  userName: string;
  weeklyHours: number;
  allocatedHours: number;
  overAllocation: number;
  utilization: number;
}>> {
  const capacities = await prisma.resourceCapacity.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const warnings: Array<{
    userId: string;
    userName: string;
    weeklyHours: number;
    allocatedHours: number;
    overAllocation: number;
    utilization: number;
  }> = [];

  for (const capacity of capacities) {
    const userCapacity = await getUserCapacity(capacity.userId);

    if (userCapacity.utilization > 100) {
      warnings.push({
        userId: capacity.userId,
        userName: `${capacity.user.firstName} ${capacity.user.lastName}`,
        weeklyHours: userCapacity.weeklyHours,
        allocatedHours: userCapacity.currentAllocation,
        overAllocation: userCapacity.currentAllocation - userCapacity.weeklyHours,
        utilization: userCapacity.utilization,
      });
    }
  }

  return warnings;
}

/**
 * Update resource capacity
 */
export async function updateResourceCapacity(
  userId: string,
  data: {
    weeklyHours?: number;
    currentAllocation?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
  }
): Promise<void> {
  const existing = await prisma.resourceCapacity.findUnique({
    where: { userId },
  });

  if (existing) {
    await prisma.resourceCapacity.update({
      where: { userId },
      data: {
        weeklyHours: data.weeklyHours,
        currentAllocation: data.currentAllocation,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      },
    });
  } else {
    await prisma.resourceCapacity.create({
      data: {
        userId,
        weeklyHours: data.weeklyHours || 40,
        currentAllocation: data.currentAllocation || 0,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      },
    });
  }
}


