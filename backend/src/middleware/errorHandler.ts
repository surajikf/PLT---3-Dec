import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-ignore
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A record with this value already exists',
      });
    }
    // Handle missing column/relation errors (schema mismatch)
    if (prismaError.code === 'P2025' || prismaError.code === 'P2017') {
      console.error('Prisma Schema Mismatch Error:', prismaError);
      return res.status(500).json({
        success: false,
        error: 'Database schema mismatch. Please run migrations: npx prisma migrate dev',
        details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined,
      });
    }
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    console.error('Prisma Validation Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Database schema mismatch. Please run: npx prisma generate && npx prisma migrate dev',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  console.error('Error:', err);
  console.error('Error Stack:', err.stack);
  
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

