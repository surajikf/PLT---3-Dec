import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteUser);

export default router;

