import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Cashiers, Managers, and Admins can checkout and read sales
router.post('/', authenticateToken, SaleController.checkout);
router.get('/', authenticateToken, SaleController.getSales);
router.get('/invoice/:invoiceNumber', authenticateToken, SaleController.getByInvoice);
router.get('/:id', authenticateToken, SaleController.getById);

export default router;
