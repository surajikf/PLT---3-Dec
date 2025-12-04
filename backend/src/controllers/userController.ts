import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, departmentId, search, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          hourlyRate: true,
          departmentId: true,
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
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, hourlyRate, departmentId, isActive } = req.body;
    const currentUser = req.user!;

    // Check permissions
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Only SUPER_ADMIN can change roles
    if (role !== undefined && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can change user roles');
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'];
      if (!validRoles.includes(role)) {
        throw new ValidationError('Invalid role');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && currentUser.role === 'SUPER_ADMIN' && { role }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can delete users');
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, isActive } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ForbiddenError('User IDs array is required');
    }

    if (typeof isActive !== 'boolean') {
      throw new ForbiddenError('isActive must be a boolean');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Don't allow deactivating yourself
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot update your own status');
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { isActive },
    });

    res.json({
      success: true,
      data: {
        updated: result.count,
        total: filteredIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, role } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ForbiddenError('User IDs array is required');
    }

    if (!role) {
      throw new ForbiddenError('Role is required');
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'];
    if (!validRoles.includes(role)) {
      throw new ForbiddenError('Invalid role');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can change user roles');
    }

    // Don't allow changing your own role
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot update your own role');
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { role },
    });

    res.json({
      success: true,
      data: {
        updated: result.count,
        total: filteredIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ForbiddenError('User IDs array is required');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can delete users');
    }

    // Don't allow deleting yourself
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot delete yourself');
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: filteredIds } },
    });

    res.json({
      success: true,
      data: {
        deleted: result.count,
        total: filteredIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role, hourlyRate, departmentId, isActive } = req.body;
    const currentUser = req.user!;

    // Check permissions - only Super Admin and Admin can create users
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions to create users');
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      throw new ValidationError('Email, password, first name, and last name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password length
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'TEAM_MEMBER',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        departmentId: departmentId || null,
        isActive: isActive !== undefined ? isActive : true, // Default to active
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

