import { Router } from 'express';
import {
  getProjectProfitLoss,
  getAllProjectsProfitLoss,
  getEmployeeCostAnalysis,
  getProfitLossDashboard,
} from '../controllers/profitLossController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get P&L dashboard summary
router.get('/dashboard', getProfitLossDashboard);

// Get all projects P&L
router.get('/projects', getAllProjectsProfitLoss);

// Get single project P&L
router.get('/projects/:id', getProjectProfitLoss);

// Get employee cost analysis
router.get('/employees', getEmployeeCostAnalysis);

export default router;

