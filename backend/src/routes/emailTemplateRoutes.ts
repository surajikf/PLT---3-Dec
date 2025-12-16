import express from 'express';
import {
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendTestEmail,
} from '../controllers/emailTemplateController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getEmailTemplates);
router.get('/:id', getEmailTemplateById);
router.post('/', createEmailTemplate);
router.patch('/:id', updateEmailTemplate);
router.delete('/:id', deleteEmailTemplate);
router.post('/:id/send-test', sendTestEmail);

export default router;


