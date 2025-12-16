import express from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  createProjectFromTemplateEndpoint,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.post('/:id/create-project', createProjectFromTemplateEndpoint);
router.patch('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;


