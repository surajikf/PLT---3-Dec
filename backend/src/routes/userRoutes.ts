import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkUpdateUserStatus,
  bulkUpdateUserRole,
  bulkDeleteUsers,
  createUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getUsers);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteUser);
router.post('/bulk/status', authorize('SUPER_ADMIN', 'ADMIN'), bulkUpdateUserStatus);
router.post('/bulk/role', authorize('SUPER_ADMIN'), bulkUpdateUserRole);
router.post('/bulk/delete', authorize('SUPER_ADMIN'), bulkDeleteUsers);

export default router;

