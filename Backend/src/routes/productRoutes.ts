import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// POS & BackOffice can view products
router.get('/', ProductController.getAll);
router.get('/barcode/:barcode', ProductController.getByBarcode);
router.get('/:id', ProductController.getById);

// Strictly Protected: Cashiers are rejected from creating/editing products
router.post('/', authenticateToken, requireRole('ADMIN', 'MANAGER'), ProductController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'MANAGER'), ProductController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), ProductController.delete);

export default router;
