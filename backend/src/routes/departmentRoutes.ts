import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate([
    body('name').notEmpty().withMessage('Department name is required'),
  ]),
  createDepartment
);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateDepartment);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteDepartment);

export default router;

