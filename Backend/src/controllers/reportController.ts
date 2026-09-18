import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const data = await ReportService.getDashboardMetrics();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, cashierId, paymentMethod } = req.query;
      const data = await ReportService.getSalesReport({
        startDate: startDate as string,
        endDate: endDate as string,
        cashierId: cashierId as string,
        paymentMethod: paymentMethod as string,
      });
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getProductPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const products = await ReportService.getProductSalesReport({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json({ success: true, products });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getStockReport(req: Request, res: Response): Promise<void> {
    try {
      const products = await ReportService.getStockReport();
      res.json({ success: true, count: products.length, products });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
