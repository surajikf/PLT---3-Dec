import { Router } from 'express';
import { body } from 'express-validator';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resourceController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'),
  validate([
    body('name').notEmpty().withMessage('Resource name is required'),
    body('type').notEmpty().withMessage('Resource type is required'),
  ]),
  createResource
);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), updateResource);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteResource);

export default router;

