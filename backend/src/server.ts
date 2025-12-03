import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profit-loss', profitLossRoutes);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

