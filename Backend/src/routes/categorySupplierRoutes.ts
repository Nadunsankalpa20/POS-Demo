import { Router } from 'express';
import { CategoryController, SupplierController, BrandController } from '../controllers/categorySupplierController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Categories
router.get('/categories', CategoryController.getAll);
router.post('/categories', authenticateToken, requireRole('ADMIN', 'MANAGER'), CategoryController.create);
router.put('/categories/:id', authenticateToken, requireRole('ADMIN', 'MANAGER'), CategoryController.update);
router.delete('/categories/:id', authenticateToken, requireRole('ADMIN'), CategoryController.delete);

// Suppliers
router.get('/suppliers', authenticateToken, requireRole('ADMIN', 'MANAGER'), SupplierController.getAll);
router.post('/suppliers', authenticateToken, requireRole('ADMIN', 'MANAGER'), SupplierController.create);
router.put('/suppliers/:id', authenticateToken, requireRole('ADMIN', 'MANAGER'), SupplierController.update);
router.delete('/suppliers/:id', authenticateToken, requireRole('ADMIN'), SupplierController.delete);

// Brands
router.get('/brands', BrandController.getAll);

export default router;
