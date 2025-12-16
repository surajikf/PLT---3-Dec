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
  changePassword,
  updateProfile,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (users can update their own profile)
router.patch('/profile', writeLimiter, updateProfile);
router.post('/change-password', writeLimiter, changePassword);

// User management routes (admin only)
router.get('/', readLimiter, authorize('SUPER_ADMIN', 'ADMIN'), getUsers);
router.post('/', writeLimiter, authorize('SUPER_ADMIN', 'ADMIN'), createUser);
router.get('/:id', readLimiter, getUserById);
router.patch('/:id', writeLimiter, updateUser);
router.delete('/:id', writeLimiter, authorize('SUPER_ADMIN'), deleteUser);

// Bulk operations
router.post('/bulk/status', writeLimiter, authorize('SUPER_ADMIN', 'ADMIN'), bulkUpdateUserStatus);
router.post('/bulk/role', writeLimiter, authorize('SUPER_ADMIN'), bulkUpdateUserRole);
router.post('/bulk/delete', writeLimiter, authorize('SUPER_ADMIN'), bulkDeleteUsers);

export default router;

