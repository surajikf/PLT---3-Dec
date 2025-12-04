/**
 * Validates required environment variables on application startup
 * Throws an error if any required variables are missing or invalid
 */

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRE?: string;
  PORT?: string;
  NODE_ENV?: string;
  CORS_ORIGIN?: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = ['DATABASE_URL', 'JWT_SECRET'];

const envValidation = {
  validate(): void {
    const missing: string[] = [];
    const invalid: string[] = [];

    // Check required variables
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // Validate JWT_SECRET
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        invalid.push('JWT_SECRET must be at least 32 characters long');
      }
      if (process.env.JWT_SECRET === 'default-secret-change-in-production') {
        invalid.push('JWT_SECRET must be changed from default value');
      }
    }

    // Validate DATABASE_URL format
    if (process.env.DATABASE_URL) {
      if (!process.env.DATABASE_URL.startsWith('mysql://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
        invalid.push('DATABASE_URL must be a valid MySQL or PostgreSQL connection string');
      }
    }

    // Validate PORT if provided
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        invalid.push('PORT must be a valid number between 1 and 65535');
      }
    }

    // Validate NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      invalid.push('NODE_ENV must be one of: development, production, test');
    }

    // Throw error if any issues found
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
      );
    }

    if (invalid.length > 0) {
      throw new Error(
        `Invalid environment variables:\n${invalid.join('\n')}\n` +
        'Please check your .env file or environment configuration.'
      );
    }
  },

  getConfig(): EnvConfig {
    return {
      DATABASE_URL: process.env.DATABASE_URL!,
      JWT_SECRET: process.env.JWT_SECRET!,
      JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
      PORT: process.env.PORT || '5000',
      NODE_ENV: process.env.NODE_ENV || 'development',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    };
  },
};

export default envValidation;

