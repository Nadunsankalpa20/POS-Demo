import { Category, ICategory } from '../models/Category';
import { Supplier, ISupplier } from '../models/Supplier';
import { Brand, IBrand } from '../models/Brand';
import { AuditService } from './AuditService';

export class CategoryService {
  static async getAll() {
    return Category.find({ active: true }).sort({ name: 1 });
  }

  static async create(data: Partial<ICategory>, user?: any) {
    const code = (data.code || data.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const category = await Category.create({ ...data, code });
    if (user) {
      await AuditService.log({
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        action: 'CREATE_CATEGORY',
        module: 'CATEGORIES',
        description: `Created category ${category.name}`,
      });
    }
    return category;
  }

  static async update(id: string, data: Partial<ICategory>, user?: any) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true });
    if (user) {
      await AuditService.log({
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        action: 'UPDATE_CATEGORY',
        module: 'CATEGORIES',
        description: `Updated category ${category?.name}`,
      });
    }
    return category;
  }

  static async delete(id: string, user?: any) {
    const category = await Category.findByIdAndUpdate(id, { active: false }, { new: true });
    if (user) {
      await AuditService.log({
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        action: 'DELETE_CATEGORY',
        module: 'CATEGORIES',
        description: `Deactivated category ${category?.name}`,
      });
    }
    return category;
  }
}

export class SupplierService {
  static async getAll() {
    return Supplier.find({ active: true }).sort({ name: 1 });
  }

  static async create(data: Partial<ISupplier>, user?: any) {
    const supplier = await Supplier.create(data);
    if (user) {
      await AuditService.log({
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        action: 'CREATE_SUPPLIER',
        module: 'SUPPLIERS',
        description: `Created supplier ${supplier.name}`,
      });
    }
    return supplier;
  }

  static async update(id: string, data: Partial<ISupplier>, user?: any) {
    const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true });
    return supplier;
  }

  static async delete(id: string, user?: any) {
    const supplier = await Supplier.findByIdAndUpdate(id, { active: false }, { new: true });
    return supplier;
  }
}

export class BrandService {
  static async getAll() {
    return Brand.find({ active: true }).sort({ name: 1 });
  }

  static async create(data: Partial<IBrand>) {
    return Brand.create(data);
  }
}
