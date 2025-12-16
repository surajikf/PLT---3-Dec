import express from 'express';
import {
  getProjectAnalyticsEndpoint,
  getOrganizationAnalyticsEndpoint,
} from '../controllers/analyticsController';
import { getDashboardData } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Dashboard endpoint - returns all dashboard data in one request
router.get('/dashboard', getDashboardData);
router.get('/projects/:id', getProjectAnalyticsEndpoint);
router.get('/organization', getOrganizationAnalyticsEndpoint);

export default router;

