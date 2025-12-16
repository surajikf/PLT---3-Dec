/**
 * Logger Utility
 * Centralized logging with environment-aware behavior
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  log(...args: any[]) {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  error(...args: any[]) {
    // Always log errors, but format them properly
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, you might want to send to a logging service
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args: any[]) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  info(...args: any[]) {
    if (isDevelopment || !isProduction) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args: any[]) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
}

export const logger = new Logger();


