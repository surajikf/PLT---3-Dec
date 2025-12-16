import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Optimize pagination - enforce max limit
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50)); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel for better performance
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          industry: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            budget: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, industry, contactPerson, email, phone, address, status } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        industry: industry || null,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        status: status || 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role === 'CLIENT' || currentUser.role === 'TEAM_MEMBER') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { name, industry, contactPerson, email, phone, address, status } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (industry !== undefined) updateData.industry = industry;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateCustomerStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ForbiddenError('Customer IDs array is required');
    }

    if (!status) {
      throw new ForbiddenError('Status is required');
    }

    const validStatuses = ['ACTIVE', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      throw new ForbiddenError('Invalid status');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const result = await prisma.customer.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    res.json({
      success: true,
      data: {
        updated: result.count,
        total: ids.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ForbiddenError('Customer IDs array is required');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const result = await prisma.customer.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({
      success: true,
      data: {
        deleted: result.count,
        total: ids.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

