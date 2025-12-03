import { Router } from 'express';
import {
  getProjectReport,
  getDepartmentReport,
  getBudgetReport,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/project', getProjectReport);
router.get('/department', authorize('SUPER_ADMIN', 'ADMIN'), getDepartmentReport);
router.get('/budget', authorize('SUPER_ADMIN', 'ADMIN'), getBudgetReport);

export default router;

