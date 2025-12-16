import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { validateEmail } from '../utils/validation';
import { sanitizeEmail, sanitizeName, sanitizeNumber, validateName } from '../utils/sanitize';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, departmentId, search, page = 1, limit = 50 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50)); // Max 100 per page

    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      const searchTerm = String(search).trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
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
    const { firstName, lastName, role, hourlyRate, departmentId, isActive, email } = req.body;
    const currentUser = req.user!;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check permissions
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Only SUPER_ADMIN can change roles
    if (role !== undefined && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can change user roles');
    }

    // Only SUPER_ADMIN can change email
    if (email !== undefined && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can change user email');
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'];
      if (!validRoles.includes(role)) {
        throw new ValidationError('Invalid role');
      }
    }

    // Validate and sanitize email if provided
    let sanitizedEmail = existingUser.email;
    if (email !== undefined) {
      validateEmail(email);
      sanitizedEmail = sanitizeEmail(email);
      
      // Check email uniqueness
      const emailUser = await prisma.user.findUnique({
        where: { email: sanitizedEmail },
      });
      
      if (emailUser && emailUser.id !== id) {
        throw new ValidationError('Email is already in use');
      }
    }

    // Validate and sanitize names
    let sanitizedFirstName = existingUser.firstName;
    let sanitizedLastName = existingUser.lastName;
    
    if (firstName !== undefined) {
      validateName(firstName, 'First name');
      sanitizedFirstName = sanitizeName(firstName);
    }
    
    if (lastName !== undefined) {
      validateName(lastName, 'Last name');
      sanitizedLastName = sanitizeName(lastName);
    }

    // Validate hourly rate
    let sanitizedHourlyRate = existingUser.hourlyRate;
    if (hourlyRate !== undefined) {
      const rate = sanitizeNumber(hourlyRate);
      if (rate !== null && (rate < 0 || rate > 100000)) {
        throw new ValidationError('Hourly rate must be between 0 and 100,000');
      }
      sanitizedHourlyRate = rate;
    }

    // Validate department exists if provided
    if (departmentId !== undefined && departmentId !== null) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new ValidationError('Department not found');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = sanitizedFirstName;
    if (lastName !== undefined) updateData.lastName = sanitizedLastName;
    if (email !== undefined && currentUser.role === 'SUPER_ADMIN') updateData.email = sanitizedEmail;
    if (role !== undefined && currentUser.role === 'SUPER_ADMIN') updateData.role = role;
    if (hourlyRate !== undefined) updateData.hourlyRate = sanitizedHourlyRate;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (isActive !== undefined && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')) {
      // Prevent deactivating yourself
      if (id === currentUser.userId && !isActive) {
        throw new ForbiddenError('Cannot deactivate your own account');
      }
      updateData.isActive = isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      details: {
        updatedFields: Object.keys(updateData),
        updatedBy: currentUser.email,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
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

    // Prevent deleting yourself
    if (id === currentUser.userId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Use soft delete (deactivate) instead of hard delete for data integrity
    // Check if user has associated data
    const [projects, timesheets, tasks] = await Promise.all([
      prisma.project.count({
        where: {
          OR: [
            { managerId: id },
            { createdById: id },
            { members: { some: { userId: id } } },
          ],
        },
      }),
      prisma.timesheet.count({ where: { userId: id } }),
      prisma.task.count({
        where: {
          OR: [
            { assignedToId: id },
            { createdById: id },
          ],
        },
      }),
    ]);

    if (projects > 0 || timesheets > 0 || tasks > 0) {
      // Soft delete - deactivate instead
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      await createAuditLog({
        userId: currentUser.userId,
        action: 'DEACTIVATE_USER',
        entityType: 'User',
        entityId: id,
        details: {
          reason: 'User has associated data, deactivated instead of deleted',
          email: user.email,
        },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });

      res.json({
        success: true,
        message: 'User deactivated successfully (has associated data)',
        data: { deactivated: true },
      });
    } else {
      // Hard delete if no associated data
      await prisma.user.delete({
        where: { id },
      });

      await createAuditLog({
        userId: currentUser.userId,
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: id,
        details: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, isActive } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('User IDs array is required');
    }

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Insufficient permissions');
    }

    // Don't allow deactivating yourself
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot update your own status');
    }

    // Validate all IDs exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: filteredIds } },
      select: { id: true },
    });

    if (existingUsers.length !== filteredIds.length) {
      throw new ValidationError('Some user IDs are invalid');
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { isActive },
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'BULK_UPDATE_USER_STATUS',
      entityType: 'User',
      details: {
        count: result.count,
        isActive,
        userIds: filteredIds,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
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
      throw new ValidationError('User IDs array is required');
    }

    if (!role) {
      throw new ValidationError('Role is required');
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Invalid role');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can change user roles');
    }

    // Don't allow changing your own role
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot update your own role');
    }

    // Validate all IDs exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: filteredIds } },
      select: { id: true },
    });

    if (existingUsers.length !== filteredIds.length) {
      throw new ValidationError('Some user IDs are invalid');
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { role },
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'BULK_UPDATE_USER_ROLE',
      entityType: 'User',
      details: {
        count: result.count,
        role,
        userIds: filteredIds,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
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
      throw new ValidationError('User IDs array is required');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can delete users');
    }

    // Don't allow deleting yourself
    const filteredIds = ids.filter((id: string) => id !== currentUser.userId);

    if (filteredIds.length === 0) {
      throw new ForbiddenError('Cannot delete yourself');
    }

    // Get users to delete for audit log
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: filteredIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (usersToDelete.length === 0) {
      throw new ValidationError('No valid users found to delete');
    }

    // Use soft delete (deactivate) for users with associated data
    // For simplicity, we'll deactivate all users in bulk delete
    // Hard delete can be done individually if needed
    const deactivateResult = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { isActive: false },
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'BULK_DEACTIVATE_USERS',
      entityType: 'User',
      details: {
        count: deactivateResult.count,
        users: usersToDelete.map(u => ({ id: u.id, email: u.email })),
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      data: {
        deactivated: deactivateResult.count,
        total: filteredIds.length,
      },
      message: `${deactivateResult.count} user(s) deactivated successfully`,
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

    // Validate and sanitize email
    validateEmail(email);
    const sanitizedEmail = sanitizeEmail(email);

    // Validate password is provided (no strength requirements)
    if (!password || password.trim().length === 0) {
      throw new ValidationError('Password is required');
    }

    // Validate and sanitize names
    validateName(firstName, 'First name');
    validateName(lastName, 'Last name');
    const sanitizedFirstName = sanitizeName(firstName);
    const sanitizedLastName = sanitizeName(lastName);

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'];
    const userRole = role || 'TEAM_MEMBER';
    if (!validRoles.includes(userRole)) {
      throw new ValidationError('Invalid role');
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN or ADMIN users
    if ((userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only Super Admin can create Admin or Super Admin users');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Validate hourly rate
    let sanitizedHourlyRate: number | null = null;
    if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== '') {
      const rate = sanitizeNumber(hourlyRate);
      if (rate === null || rate < 0 || rate > 100000) {
        throw new ValidationError('Hourly rate must be between 0 and 100,000');
      }
      sanitizedHourlyRate = rate;
    }

    // Validate department exists if provided
    if (departmentId !== undefined && departmentId !== null && departmentId !== '') {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new ValidationError('Department not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for better security

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        role: userRole,
        hourlyRate: sanitizedHourlyRate,
        departmentId: departmentId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true, // Default to active
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

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
        createdBy: currentUser.email,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const currentUser = req.user!;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    // Validate new password is provided (no strength requirements)
    if (!newPassword || newPassword.trim().length === 0) {
      throw new ValidationError('New password is required');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile (for users to update their own profile)
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;
    const currentUser = req.user!;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, firstName: true, lastName: true, profilePicture: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate and sanitize names
    let sanitizedFirstName = user.firstName;
    let sanitizedLastName = user.lastName;

    if (firstName !== undefined) {
      validateName(firstName, 'First name');
      sanitizedFirstName = sanitizeName(firstName);
    }

    if (lastName !== undefined) {
      validateName(lastName, 'Last name');
      sanitizedLastName = sanitizeName(lastName);
    }

    // Validate profile picture URL if provided
    let sanitizedProfilePicture = user.profilePicture;
    if (profilePicture !== undefined) {
      if (profilePicture === null || profilePicture === '') {
        sanitizedProfilePicture = null;
      } else if (typeof profilePicture === 'string') {
        // Basic URL validation
        try {
          new URL(profilePicture);
          sanitizedProfilePicture = profilePicture;
        } catch {
          // If not a valid URL, assume it's a base64 data URL or relative path
          sanitizedProfilePicture = profilePicture;
        }
      }
    }

    // Update profile
    const updateData: any = {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
    };
    if (profilePicture !== undefined) {
      updateData.profilePicture = sanitizedProfilePicture;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        hourlyRate: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Audit log
    const updatedFields = [];
    if (firstName !== undefined) updatedFields.push('firstName');
    if (lastName !== undefined) updatedFields.push('lastName');
    if (profilePicture !== undefined) updatedFields.push('profilePicture');

    await createAuditLog({
      userId: currentUser.userId,
      action: 'UPDATE_PROFILE',
      entityType: 'User',
      entityId: user.id,
      details: {
        updatedFields,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

