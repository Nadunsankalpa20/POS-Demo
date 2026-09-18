import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Only ADMIN can view system audit logs
router.get('/', authenticateToken, requireRole('ADMIN'), AuditController.getLogs);

export default router;
