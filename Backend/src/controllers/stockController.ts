import { Request, Response } from 'express';
import { StockService } from '../services/StockService';
import { AuthRequest } from '../middleware/auth';

export class StockController {
  static async stockIn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await StockService.stockIn(req.body, req.user);
      res.status(201).json({
        success: true,
        message: `Stock In successful: Added ${req.body.quantity} units`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async stockOut(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await StockService.stockOut(req.body, req.user);
      res.json({
        success: true,
        message: `Stock Out recorded: Deducted ${req.body.quantity} units`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async voidSale(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await StockService.voidSale(id, reason, req.user);
      res.json({
        success: true,
        message: 'Sale voided and inventory successfully restored.',
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const { productId, type, page, limit } = req.query;
      const result = await StockService.getMovements({
        productId: productId as string,
        type: type as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const products = await StockService.getLowStock();
      res.json({ success: true, count: products.length, products });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
