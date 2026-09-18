import { Router } from 'express';
import { StockController } from '../controllers/stockController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Strictly Protected: Cashiers are rejected from inventory operations
router.post('/in', authenticateToken, requireRole('ADMIN', 'MANAGER'), StockController.stockIn);
router.post('/out', authenticateToken, requireRole('ADMIN', 'MANAGER'), StockController.stockOut);
router.post('/void/:id', authenticateToken, requireRole('ADMIN', 'MANAGER'), StockController.voidSale);
router.get('/movements', authenticateToken, requireRole('ADMIN', 'MANAGER'), StockController.getMovements);
router.get('/low-stock', authenticateToken, requireRole('ADMIN', 'MANAGER'), StockController.getLowStock);

export default router;
