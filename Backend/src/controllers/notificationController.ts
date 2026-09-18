import { Request, Response } from 'express';
import { sendInvoiceEmail, sendInvoiceSMS } from '../services/NotificationService';

export class NotificationController {
  /**
   * POST /api/notifications/send-invoice
   * Body: { email?, phone?, sale }
   * Sends invoice email and/or SMS based on what is provided.
   */
  static async sendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, sale } = req.body;

      if (!sale) {
        res.status(400).json({ success: false, message: 'Sale data is required.' });
        return;
      }

      const results: Record<string, any> = {};

      // Send email if provided
      if (email && email.trim()) {
        const emailResult = await sendInvoiceEmail(email.trim(), sale);
        results.email = emailResult;
      }

      // Send SMS if provided
      if (phone && phone.trim()) {
        const smsResult = await sendInvoiceSMS(phone.trim(), sale);
        results.sms = smsResult;
      }

      if (!email && !phone) {
        res.status(400).json({ success: false, message: 'At least one of email or phone must be provided.' });
        return;
      }

      const anySuccess = Object.values(results).some((r: any) => r.success);

      res.json({
        success: anySuccess,
        message: anySuccess
          ? 'Invoice notification(s) sent successfully!'
          : 'Failed to send notifications.',
        results,
      });
    } catch (err: any) {
      console.error('[NotificationController] Error:', err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
