import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkUpdateCustomerStatus,
  bulkDeleteCustomers,
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'),
  validate([
    body('name').notEmpty().withMessage('Customer name is required'),
  ]),
  createCustomer
);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), updateCustomer);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteCustomer);
router.post('/bulk/status', authorize('SUPER_ADMIN', 'ADMIN'), bulkUpdateCustomerStatus);
router.post('/bulk/delete', authorize('SUPER_ADMIN', 'ADMIN'), bulkDeleteCustomers);

export default router;

