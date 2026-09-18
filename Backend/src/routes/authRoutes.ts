import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.me);
router.get('/users', authenticateToken, requireRole('ADMIN', 'MANAGER'), AuthController.getUsers);
router.post('/users', authenticateToken, requireRole('ADMIN'), AuthController.createUser);
router.put('/users/:id', authenticateToken, requireRole('ADMIN'), AuthController.updateUser);

export default router;
