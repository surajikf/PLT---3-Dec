import { ValidationError } from './errors';

/**
 * Validate project code format
 */
export function validateProjectCode(code: string): void {
  if (!code || !code.trim()) {
    throw new ValidationError('Project code is required');
  }
  
  if (code.length < 3 || code.length > 50) {
    throw new ValidationError('Project code must be between 3 and 50 characters');
  }
  
  // Allow alphanumeric, dashes, underscores
  if (!/^[A-Z0-9-_]+$/i.test(code)) {
    throw new ValidationError('Project code can only contain letters, numbers, dashes, and underscores');
  }
}

/**
 * Validate project budget
 */
export function validateBudget(budget: number | string | null | undefined): number {
  if (budget === null || budget === undefined || budget === '') {
    return 0;
  }
  
  const budgetNum = typeof budget === 'string' ? parseFloat(budget) : budget;
  
  if (isNaN(budgetNum)) {
    throw new ValidationError('Budget must be a valid number');
  }
  
  if (budgetNum < 0) {
    throw new ValidationError('Budget cannot be negative');
  }
  
  if (budgetNum > 1000000000) {
    throw new ValidationError('Budget is too large (max: 1 billion)');
  }
  
  return budgetNum;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date | string | null, endDate: Date | string | null): void {
  if (startDate && endDate) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (end < start) {
      throw new ValidationError('End date must be after start date');
    }
  }
}

/**
 * Validate hours for timesheet
 */
export function validateHours(hours: number | string): number {
  const hoursNum = typeof hours === 'string' ? parseFloat(hours) : hours;
  
  if (isNaN(hoursNum)) {
    throw new ValidationError('Hours must be a valid number');
  }
  
  if (hoursNum < 0.5) {
    throw new ValidationError('Minimum hours is 0.5');
  }
  
  if (hoursNum > 24) {
    throw new ValidationError('Maximum hours per day is 24');
  }
  
  // Round to 2 decimal places for precision
  return Math.round(hoursNum * 100) / 100;
}

/**
 * Validate timesheet date (no future dates)
 */
export function validateTimesheetDate(date: Date | string): Date {
  const entryDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (entryDate > today) {
    throw new ValidationError('Cannot log time for future dates');
  }
  
  // Optionally prevent dates too far in the past (e.g., > 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (entryDate < oneYearAgo) {
    throw new ValidationError('Cannot log time for dates more than 1 year ago');
  }
  
  return entryDate;
}

/**
 * Validate stage weights sum to 100%
 */
export function validateStageWeights(weights: number[]): void {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  
  if (Math.abs(total - 100) > 0.01) {
    throw new ValidationError(`Stage weights must sum to 100% (currently ${total.toFixed(1)}%)`);
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  if (!email || !email.trim()) {
    throw new ValidationError('Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate required fields
 */
export function validateRequired(fields: Record<string, any>, fieldNames: string[]): void {
  for (const fieldName of fieldNames) {
    const value = fields[fieldName];
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      throw new ValidationError(`${fieldName} is required`);
    }
  }
}

