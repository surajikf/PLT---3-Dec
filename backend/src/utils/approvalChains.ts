/**
 * Approval Chains Management
 * Handles multi-level approval workflows
 */

import prisma from './prisma';
import { ValidationError, NotFoundError } from './errors';

export interface ApprovalStep {
  step: number;
  approverType: 'ROLE' | 'USER' | 'MANAGER';
  approverValue: string; // Role name, User ID, or 'MANAGER'
  required: boolean;
}

/**
 * Get approval chain for entity type
 */
export async function getApprovalChain(
  entityType: string
): Promise<any | null> {
  return await prisma.approvalChain.findFirst({
    where: {
      entityType,
      isActive: true,
    },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Process approval request
 */
export async function processApprovalRequest(
  requestId: string,
  approverId: string,
  action: 'APPROVE' | 'REJECT',
  reason?: string
): Promise<{
  completed: boolean;
  nextStep?: number;
  message: string;
}> {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: {
      chain: true,
    },
  });

  if (!request) {
    throw new NotFoundError('Approval request not found');
  }

  if (request.status !== 'PENDING') {
    throw new ValidationError('Approval request is not pending');
  }

  const steps = request.chain.steps as ApprovalStep[];
  const currentStepData = steps[request.currentStep];

  if (!currentStepData) {
    throw new ValidationError('Invalid approval step');
  }

  if (action === 'REJECT') {
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    return {
      completed: true,
      message: 'Approval request rejected',
    };
  }

  // Approve current step
  const nextStep = request.currentStep + 1;

  if (nextStep >= steps.length) {
    // All steps approved
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        currentStep: nextStep,
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    return {
      completed: true,
      message: 'Approval request fully approved',
    };
  }

  // Move to next step
  await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      currentStep: nextStep,
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });

  return {
    completed: false,
    nextStep,
    message: `Step ${request.currentStep + 1} approved. Moving to step ${nextStep + 1}`,
  };
}

/**
 * Create approval request
 */
export async function createApprovalRequest(
  entityType: string,
  entityId: string,
  requestedById: string,
  metadata?: Record<string, any>
): Promise<any> {
  const chain = await getApprovalChain(entityType);

  if (!chain) {
    // No approval chain, auto-approve
    return {
      id: null,
      status: 'APPROVED',
      message: 'No approval chain configured, auto-approved',
    };
  }

  const steps = chain.steps as ApprovalStep[];
  if (steps.length === 0) {
    throw new ValidationError('Approval chain has no steps');
  }

  const request = await prisma.approvalRequest.create({
    data: {
      entityType,
      entityId,
      chainId: chain.id,
      currentStep: 0,
      status: 'PENDING',
      requestedById,
      metadata: metadata || {},
    },
    include: {
      chain: true,
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return request;
}

/**
 * Get pending approvals for user
 */
export async function getPendingApprovalsForUser(userId: string, userRole: string): Promise<any[]> {
  const chains = await prisma.approvalChain.findMany({
    where: { isActive: true },
    include: {
      approvalRequests: {
        where: {
          status: 'PENDING',
        },
        include: {
          requester: {
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

  const pendingRequests: any[] = [];

  for (const chain of chains) {
    const steps = chain.steps as ApprovalStep[];

    for (const request of chain.approvalRequests) {
      const currentStepData = steps[request.currentStep];

      if (!currentStepData) continue;

      let canApprove = false;

      if (currentStepData.approverType === 'ROLE') {
        canApprove = currentStepData.approverValue === userRole;
      } else if (currentStepData.approverType === 'USER') {
        canApprove = currentStepData.approverValue === userId;
      } else if (currentStepData.approverType === 'MANAGER') {
        // Would need to check if user is manager of the requester
        // This is simplified - implement based on your org structure
        canApprove = ['ADMIN', 'PROJECT_MANAGER'].includes(userRole);
      }

      if (canApprove) {
        pendingRequests.push({
          ...request,
          chainName: chain.name,
          currentStepInfo: currentStepData,
        });
      }
    }
  }

  return pendingRequests;
}

