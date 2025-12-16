import express from 'express';
import {
  getApprovalChains,
  getApprovalChainById,
  createApprovalChain,
  updateApprovalChain,
  getPendingApprovals,
  processApproval,
  createApprovalRequestEndpoint,
} from '../controllers/approvalChainController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getApprovalChains);
router.get('/pending', getPendingApprovals);
router.get('/:id', getApprovalChainById);
router.post('/', createApprovalChain);
router.post('/requests', createApprovalRequestEndpoint);
router.patch('/:id', updateApprovalChain);
router.post('/requests/:id/process', processApproval);

export default router;

