/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks
 */
import { ValidationError } from './errors';

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input: string | null | undefined, maxLength?: number): string {
  if (!input) return '';
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize email - basic cleanup
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize name - allow letters, spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string | null | undefined, maxLength: number = 100): string {
  if (!name) return '';
  
  let sanitized = name.trim();
  
  // Remove dangerous characters, keep only letters, spaces, hyphens, apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '');
  
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    return null;
  }
  
  return num;
}

/**
 * Validate name format
 */
export function validateName(name: string, fieldName: string = 'Name'): void {
  if (!name || !name.trim()) {
    throw new ValidationError(`${fieldName} is required`);
  }
  
  if (name.trim().length < 2) {
    throw new ValidationError(`${fieldName} must be at least 2 characters long`);
  }
  
  if (name.trim().length > 100) {
    throw new ValidationError(`${fieldName} must be less than 100 characters`);
  }
  
  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    throw new ValidationError(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
}

