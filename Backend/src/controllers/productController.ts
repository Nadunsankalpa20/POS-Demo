import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { AuthRequest } from '../middleware/auth';

export class ProductController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, categoryId, status, lowStock, page, limit } = req.query;
      const result = await ProductService.getAll({
        search: search as string,
        categoryId: categoryId as string,
        status: status as string,
        lowStock: lowStock === 'true',
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 100,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.getById(req.params.id);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.json({ success: true, product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByBarcode(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.getByBarcode(req.params.barcode);
      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product with barcode '${req.params.barcode}' not found in inventory.`,
        });
        return;
      }
      res.json({ success: true, product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await ProductService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await ProductService.update(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Product updated successfully',
        product,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await ProductService.delete(req.params.id, req.user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
