import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Strictly Protected: Cashiers cannot access BackOffice reports
router.get('/dashboard', authenticateToken, requireRole('ADMIN', 'MANAGER'), ReportController.getDashboard);
router.get('/sales', authenticateToken, requireRole('ADMIN', 'MANAGER'), ReportController.getSalesReport);
router.get('/products', authenticateToken, requireRole('ADMIN', 'MANAGER'), ReportController.getProductPerformance);
router.get('/stock', authenticateToken, requireRole('ADMIN', 'MANAGER'), ReportController.getStockReport);

export default router;
