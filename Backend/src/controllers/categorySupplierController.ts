import { Request, Response } from 'express';
import { CategoryService, SupplierService, BrandService } from '../services/CategorySupplierService';
import { AuthRequest } from '../middleware/auth';

export class CategoryController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getAll();
      res.json({ success: true, categories });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const category = await CategoryService.create(req.body, req.user);
      res.status(201).json({ success: true, category });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const category = await CategoryService.update(req.params.id, req.body, req.user);
      res.json({ success: true, category });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const category = await CategoryService.delete(req.params.id, req.user);
      res.json({ success: true, category });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export class SupplierController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await SupplierService.getAll();
      res.json({ success: true, suppliers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const supplier = await SupplierService.create(req.body, req.user);
      res.status(201).json({ success: true, supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const supplier = await SupplierService.update(req.params.id, req.body, req.user);
      res.json({ success: true, supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const supplier = await SupplierService.delete(req.params.id, req.user);
      res.json({ success: true, supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export class BrandController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const brands = await BrandService.getAll();
      res.json({ success: true, brands });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
