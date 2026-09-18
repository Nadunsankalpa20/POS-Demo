import { Request, Response } from 'express';
import { SaleService } from '../services/SaleService';
import { AuthRequest } from '../middleware/auth';

export class SaleController {
  static async checkout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sale = await SaleService.checkout(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Sale completed successfully',
        sale,
      });
    } catch (err: any) {
      console.error('[SaleController] Checkout error:', err.message);
      res.status(400).json({
        success: false,
        message: err.message || 'Checkout failed. Please check stock and try again.',
      });
    }
  }

  static async getSales(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, startDate, endDate, cashierId, paymentMethod, status, invoiceNumber } = req.query;
      const result = await SaleService.getSales({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        startDate: startDate as string,
        endDate: endDate as string,
        cashierId: cashierId as string,
        paymentMethod: paymentMethod as string,
        status: status as string,
        invoiceNumber: invoiceNumber as string,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const sale = await SaleService.getSaleById(req.params.id);
      if (!sale) {
        res.status(404).json({ success: false, message: 'Sale invoice not found' });
        return;
      }
      res.json({ success: true, sale });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByInvoice(req: Request, res: Response): Promise<void> {
    try {
      const sale = await SaleService.getSaleByInvoice(req.params.invoiceNumber);
      if (!sale) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, sale });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
