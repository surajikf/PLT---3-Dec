import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { validateEmail } from '../utils/validation';
import { sanitizeEmail, sanitizeName, validateName } from '../utils/sanitize';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role, hourlyRate, departmentId } = req.body;

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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password with increased rounds for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (default isActive to true)
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        role: role || 'TEAM_MEMBER',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        departmentId: departmentId || null,
        isActive: true, // Explicitly set to true for new users
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        departmentId: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact your administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Audit failed login attempt
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: {
          email: sanitizedEmail,
          reason: 'Invalid password',
        },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Audit successful login
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
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
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          role: user.role,
          hourlyRate: user.hourlyRate,
          department: user.department,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as any;

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
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
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: currentUser,
    });
  } catch (error) {
    next(error);
  }
};

