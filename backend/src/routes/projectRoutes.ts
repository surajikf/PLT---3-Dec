import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  assignMembers,
  updateProjectStage,
  bulkUpdateProjectStatus,
  bulkDeleteProjects,
  bulkRestoreProjects,
} from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'),
  validate([
    body('code').notEmpty().withMessage('Project code is required'),
    body('name').notEmpty().withMessage('Project name is required'),
  ]),
  createProject
);
router.patch('/:id', updateProject);
router.post('/:id/members', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), assignMembers);
router.patch('/:projectId/stages/:projectStageId', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), updateProjectStage);
router.post('/bulk/status', authorize('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), bulkUpdateProjectStatus);
router.post('/bulk/delete', authorize('SUPER_ADMIN', 'ADMIN'), bulkDeleteProjects);
router.post('/bulk/restore', authorize('SUPER_ADMIN', 'ADMIN'), bulkRestoreProjects);

export default router;

