import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  approveTimesheet,
  rejectTimesheet,
  bulkApproveTimesheets,
  bulkRejectTimesheets,
} from '../controllers/timesheetController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getTimesheets);
router.post(
  '/',
  validate([
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('hours').isFloat({ min: 0.5, max: 24 }).withMessage('Hours must be between 0.5 and 24'),
  ]),
  createTimesheet
);
router.patch('/:id', updateTimesheet);
router.post('/:id/approve', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), approveTimesheet);
router.post('/:id/reject', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), rejectTimesheet);
router.post('/bulk/approve', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), bulkApproveTimesheets);
router.post('/bulk/reject', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), bulkRejectTimesheets);

export default router;

