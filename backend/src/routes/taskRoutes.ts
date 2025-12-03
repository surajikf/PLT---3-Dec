import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post(
  '/',
  validate([
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('title').notEmpty().withMessage('Task title is required'),
  ]),
  createTask
);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;

