import express from 'express';
import {
  getUserCapacityEndpoint,
  checkCapacity,
  getOverallocationWarningsEndpoint,
  updateCapacity,
} from '../controllers/resourceCapacityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/users/:userId', getUserCapacityEndpoint);
router.post('/check', checkCapacity);
router.get('/warnings', getOverallocationWarningsEndpoint);
router.patch('/users/:userId', updateCapacity);

export default router;

