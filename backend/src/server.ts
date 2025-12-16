import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, writeLimiter, readLimiter } from './middleware/rateLimiter';
import envValidation from './utils/envValidation';

// Load environment variables
dotenv.config();

// Validate environment variables on startup
try {
  envValidation.validate();
  console.log('✅ Environment variables validated');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import timesheetRoutes from './routes/timesheetRoutes';
import customerRoutes from './routes/customerRoutes';
import departmentRoutes from './routes/departmentRoutes';
import resourceRoutes from './routes/resourceRoutes';
import reportRoutes from './routes/reportRoutes';
import stageRoutes from './routes/stageRoutes';
import taskRoutes from './routes/taskRoutes';
import profitLossRoutes from './routes/profitLossRoutes';
import templateRoutes from './routes/templateRoutes';
import taskDependencyRoutes from './routes/taskDependencyRoutes';
import resourceCapacityRoutes from './routes/resourceCapacityRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import scheduledJobsRoutes from './routes/scheduledJobsRoutes';
import approvalChainRoutes from './routes/approvalChainRoutes';
import emailTemplateRoutes from './routes/emailTemplateRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// CORS configuration - allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Origin required in production'));
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow localhost for testing
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        // In production, only allow explicitly configured origins
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply general API rate limiting to all routes
app.use('/api', apiLimiter);

// API Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', writeLimiter, userRoutes);
// Projects: Use readLimiter since most operations are reads (GET requests)
// Write operations (POST/PUT/DELETE) are protected by route-level authorization
app.use('/api/projects', readLimiter, projectRoutes);
app.use('/api/timesheets', writeLimiter, timesheetRoutes);
app.use('/api/customers', writeLimiter, customerRoutes);
app.use('/api/departments', writeLimiter, departmentRoutes);
app.use('/api/resources', writeLimiter, resourceRoutes);
app.use('/api/reports', readLimiter, reportRoutes);
app.use('/api/stages', writeLimiter, stageRoutes);
app.use('/api/tasks', writeLimiter, taskRoutes);
app.use('/api/tasks', writeLimiter, taskDependencyRoutes);
app.use('/api/profit-loss', readLimiter, profitLossRoutes);
app.use('/api/templates', writeLimiter, templateRoutes);
app.use('/api/capacity', readLimiter, resourceCapacityRoutes);
app.use('/api/analytics', readLimiter, analyticsRoutes);
app.use('/api/jobs', writeLimiter, scheduledJobsRoutes);
app.use('/api/approval-chains', writeLimiter, approvalChainRoutes);
app.use('/api/email-templates', writeLimiter, emailTemplateRoutes);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Only listen in non-serverless environments
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

