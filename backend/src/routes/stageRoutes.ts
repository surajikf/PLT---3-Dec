import { Router } from 'express';
import { body } from 'express-validator';
import {
  getStages,
  getStageById,
  createStage,
  updateStage,
  deleteStage,
} from '../controllers/stageController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getStages);
router.get('/:id', getStageById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate([
    body('name').notEmpty().withMessage('Stage name is required'),
  ]),
  createStage
);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateStage);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteStage);

export default router;

