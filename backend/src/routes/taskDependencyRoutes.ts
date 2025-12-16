import express from 'express';
import {
  addTaskDependency,
  getTaskDependencies,
  checkTaskCanStart,
  removeTaskDependency,
} from '../controllers/taskDependencyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/:taskId/dependencies', addTaskDependency);
router.get('/:taskId/dependencies', getTaskDependencies);
router.get('/:taskId/can-start', checkTaskCanStart);
router.delete('/:taskId/dependencies/:dependsOnTaskId', removeTaskDependency);

export default router;

