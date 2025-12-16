/**
 * Project Automation Logic
 * Handles automatic project state management and business rules
 */

import prisma from './prisma';
import { ProjectStatus } from './projectWorkflow';

/**
 * Check if project should be auto-completed based on stage completion
 */
export async function checkAndAutoCompleteProject(projectId: string): Promise<{
  shouldComplete: boolean;
  reason?: string;
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        include: {
          stage: true,
        },
      },
    },
  });

  if (!project) {
    return { shouldComplete: false, reason: 'Project not found' };
  }

  // Only auto-complete if project is IN_PROGRESS
  if (project.status !== 'IN_PROGRESS') {
    return { shouldComplete: false };
  }

  // Check if all stages are closed
  if (project.stages.length === 0) {
    return { shouldComplete: false };
  }

  const allStagesClosed = project.stages.every((ps: any) => ps.status === 'CLOSED');
  const hasActiveStages = project.stages.some((ps: any) => 
    ps.status === 'ON' || ps.status === 'IN_PROGRESS'
  );

  if (allStagesClosed && !hasActiveStages) {
    return {
      shouldComplete: true,
      reason: 'All project stages have been completed',
    };
  }

  return { shouldComplete: false };
}

/**
 * Auto-complete project if all stages are closed
 */
export async function autoCompleteProjectIfReady(projectId: string): Promise<boolean> {
  const check = await checkAndAutoCompleteProject(projectId);
  
  if (check.shouldComplete) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.COMPLETED,
        endDate: project.endDate || new Date(),
      },
    });
    return true;
  }
  
  return false;
}

/**
 * Calculate and update project progress based on stages
 */
export async function calculateAndUpdateProjectProgress(projectId: string): Promise<number> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        include: {
          stage: true,
        },
      },
    },
  });

  if (!project) {
    return 0;
  }

  let totalProgress = 0;
  let totalWeight = 0;

  for (const projectStage of project.stages) {
    const weight = projectStage.weight || projectStage.stage.defaultWeight || 0;
    totalWeight += weight;

    if (projectStage.status === 'CLOSED') {
      totalProgress += weight;
    } else if (projectStage.status === 'IN_PROGRESS') {
      // Count IN_PROGRESS as 50% complete
      totalProgress += weight * 0.5;
    } else if (projectStage.status === 'ON') {
      // Count ON as 25% complete (just started)
      totalProgress += weight * 0.25;
    }
  }

  const progress = totalWeight > 0 ? (totalProgress / totalWeight) * 100 : 0;
  
  // Update health score will be calculated separately, but we can store progress
  // For now, we'll just return it - the health score calculation uses this
  
  return Math.round(progress * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate project member has required data before allowing timesheet entry
 */
export async function validateProjectMemberForTimesheet(
  userId: string,
  projectId: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if user is a project member
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!membership) {
    errors.push('User is not assigned to this project');
    return { valid: false, errors, warnings };
  }

  // Check if user has hourly rate (warning, not error)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hourlyRate: true, isActive: true },
  });

  if (!user) {
    errors.push('User not found');
    return { valid: false, errors, warnings };
  }

  if (!user.isActive) {
    errors.push('User account is inactive');
    return { valid: false, errors, warnings };
  }

  if (!user.hourlyRate || user.hourlyRate <= 0) {
    warnings.push('User does not have an hourly rate set. Cost calculations will be zero.');
  }

  // Check if project is in a valid status for timesheet entry
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, isArchived: true },
  });

  if (!project) {
    errors.push('Project not found');
    return { valid: false, errors, warnings };
  }

  if (project.isArchived) {
    errors.push('Cannot log time to archived projects');
    return { valid: false, errors, warnings };
  }

  if (project.status === 'CANCELLED') {
    errors.push('Cannot log time to cancelled projects');
    return { valid: false, errors, warnings };
  }

  if (project.status === 'COMPLETED') {
    warnings.push('Logging time to a completed project');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get project health recommendations
 */
export async function getProjectHealthRecommendations(projectId: string): Promise<{
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    message: string;
    action?: string;
  }>;
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        include: {
          stage: true,
        },
      },
      timesheets: {
        where: {
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              hourlyRate: true,
            },
          },
        },
      },
      members: {
        include: {
          user: {
            select: {
              hourlyRate: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    return { recommendations: [] };
  }

  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    message: string;
    action?: string;
  }> = [];

  // Budget recommendations
  if (project.budget > 0) {
    const totalCost = project.timesheets.reduce((sum, ts) => {
      return sum + (ts.hours * (ts.user.hourlyRate || 0));
    }, 0);
    const utilization = (totalCost / project.budget) * 100;

    if (utilization >= 100) {
      recommendations.push({
        priority: 'high',
        category: 'Budget',
        message: `Project has exceeded budget by ${((utilization - 100) * project.budget / 100).toFixed(2)}`,
        action: 'Review project scope and costs',
      });
    } else if (utilization >= 90) {
      recommendations.push({
        priority: 'high',
        category: 'Budget',
        message: `Project has used ${utilization.toFixed(1)}% of budget`,
        action: 'Monitor spending closely',
      });
    } else if (utilization >= 80) {
      recommendations.push({
        priority: 'medium',
        category: 'Budget',
        message: `Project has used ${utilization.toFixed(1)}% of budget`,
        action: 'Review remaining budget allocation',
      });
    }
  }

  // Timeline recommendations
  if (project.endDate) {
    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const progress = await calculateAndUpdateProjectProgress(projectId);

    if (daysRemaining < 0) {
      recommendations.push({
        priority: 'high',
        category: 'Timeline',
        message: `Project deadline has passed (${Math.abs(daysRemaining)} days overdue)`,
        action: 'Update project timeline or extend deadline',
      });
    } else if (daysRemaining <= 7 && progress < 90) {
      recommendations.push({
        priority: 'high',
        category: 'Timeline',
        message: `Project deadline in ${daysRemaining} days but only ${progress.toFixed(1)}% complete`,
        action: 'Accelerate progress or adjust timeline',
      });
    } else if (daysRemaining <= 14) {
      recommendations.push({
        priority: 'medium',
        category: 'Timeline',
        message: `Project deadline approaching in ${daysRemaining} days`,
        action: 'Review project status and deliverables',
      });
    }
  }

  // Team recommendations
  const activeMembers = project.members.filter((m: any) => m.user.isActive);
  const membersWithoutRates = project.members.filter(
    (m: any) => !m.user.hourlyRate || m.user.hourlyRate <= 0
  );

  if (membersWithoutRates.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Team',
      message: `${membersWithoutRates.length} team member(s) without hourly rates`,
      action: 'Set hourly rates for accurate cost tracking',
    });
  }

  if (activeMembers.length === 0) {
    recommendations.push({
      priority: 'high',
      category: 'Team',
      message: 'Project has no active team members',
      action: 'Assign team members to the project',
    });
  }

  // Stage recommendations
  const stalledStages = project.stages.filter(
    (ps: any) => ps.status === 'IN_PROGRESS'
  );
  
  if (stalledStages.length > 0) {
    // Check if stages have been in progress for too long (30+ days)
    const longStalled = stalledStages.filter((ps: any) => {
      // This would require tracking when stage started, which we don't have
      // For now, just flag if there are multiple stalled stages
      return true;
    });

    if (longStalled.length >= 2) {
      recommendations.push({
        priority: 'medium',
        category: 'Stages',
        message: `${stalledStages.length} stage(s) in progress`,
        action: 'Review and update stage statuses',
      });
    }
  }

  return { recommendations };
}

/**
 * Auto-archive old completed projects
 */
export async function autoArchiveOldProjects(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.project.updateMany({
    where: {
      status: ProjectStatus.COMPLETED,
      isArchived: false,
      updatedAt: {
        lte: cutoffDate,
      },
    },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });

  return result.count;
}

