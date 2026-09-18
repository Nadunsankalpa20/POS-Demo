import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import stockRoutes from './stockRoutes';
import saleRoutes from './saleRoutes';
import reportRoutes from './reportRoutes';
import categorySupplierRoutes from './categorySupplierRoutes';
import auditRoutes from './auditRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);
router.use('/', categorySupplierRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);

export default router;
