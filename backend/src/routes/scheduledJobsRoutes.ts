import express from 'express';
import {
  runDailyMaintenance,
  checkTimesheetDeadlines,
  updateTaskActualHours,
  generateWeeklySummary,
} from '../utils/scheduledJobs';
import { authenticate } from '../middleware/auth';
import { ForbiddenError } from '../utils/errors';

const router = express.Router();

// All scheduled job routes require admin access
router.use(authenticate);

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
    return next(new ForbiddenError('Insufficient permissions'));
  }
  next();
};

router.use(requireAdmin);

router.post('/daily-maintenance', async (req, res, next) => {
  try {
    const results = await runDailyMaintenance();
    res.json({
      success: true,
      data: results,
      message: 'Daily maintenance completed',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/check-timesheet-deadlines', async (req, res, next) => {
  try {
    const results = await checkTimesheetDeadlines();
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/update-task-hours', async (req, res, next) => {
  try {
    const updated = await updateTaskActualHours();
    res.json({
      success: true,
      data: { updated },
      message: `Updated ${updated} tasks`,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly-summary', async (req, res, next) => {
  try {
    const summary = await generateWeeklySummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

