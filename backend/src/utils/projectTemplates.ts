/**
 * Project Templates Management
 * Handles project template creation and instantiation
 */

import prisma from './prisma';
import { ValidationError } from './errors';

export interface TemplateStage {
  stageId: string;
  weight: number;
}

export interface CreateProjectFromTemplateData {
  code: string;
  name: string;
  description?: string;
  customerId?: string;
  managerId?: string;
  departmentId?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  templateId: string;
}

/**
 * Create project from template
 */
export async function createProjectFromTemplate(
  data: CreateProjectFromTemplateData,
  createdById: string
): Promise<any> {
  const template = await prisma.projectTemplate.findUnique({
    where: { id: data.templateId },
  });

  if (!template) {
    throw new ValidationError('Template not found');
  }

  if (!template.isActive) {
    throw new ValidationError('Template is not active');
  }

  // Parse stages from JSON
  const stages = template.stages as TemplateStage[];

  // Calculate end date if not provided and default duration exists
  let endDate = data.endDate;
  if (!endDate && data.startDate && template.defaultDuration) {
    endDate = new Date(data.startDate);
    endDate.setDate(endDate.getDate() + template.defaultDuration);
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      customerId: data.customerId,
      managerId: data.managerId,
      departmentId: data.departmentId,
      budget: data.budget || template.defaultBudget || 0,
      startDate: data.startDate,
      endDate: endDate,
      createdById,
      status: 'PLANNING',
    },
  });

  // Add stages from template
  if (stages && Array.isArray(stages)) {
    for (const stageData of stages) {
      const stage = await prisma.stage.findUnique({
        where: { id: stageData.stageId },
      });

      if (stage) {
        await prisma.projectStage.create({
          data: {
            projectId: project.id,
            stageId: stage.id,
            weight: stageData.weight || stage.defaultWeight || 0,
            status: 'OFF',
          },
        });
      }
    }
  }

  // Return full project with stages
  return await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      stages: {
        include: {
          stage: true,
        },
      },
    },
  });
}

/**
 * Validate template data
 */
export function validateTemplateData(data: {
  name: string;
  stages?: TemplateStage[];
  defaultBudget?: number;
  defaultDuration?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (data.stages && Array.isArray(data.stages)) {
    const totalWeight = data.stages.reduce((sum, s) => sum + (s.weight || 0), 0);
    if (totalWeight > 100) {
      errors.push('Total stage weights cannot exceed 100%');
    }
  }

  if (data.defaultBudget !== undefined && data.defaultBudget < 0) {
    errors.push('Default budget cannot be negative');
  }

  if (data.defaultDuration !== undefined && data.defaultDuration < 1) {
    errors.push('Default duration must be at least 1 day');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


