import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

// POST /api/notifications/send-invoice
router.post('/send-invoice', NotificationController.sendInvoice);

export default router;
