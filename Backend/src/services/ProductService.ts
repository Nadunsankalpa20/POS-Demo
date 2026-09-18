import { Product, IProduct } from '../models/Product';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Brand } from '../models/Brand';
import { AuditService } from './AuditService';
import { broadcastEvent } from '../config/socket';

export class ProductService {
  static async getAll(params: {
    search?: string;
    categoryId?: string;
    status?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, any> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.categoryId && params.categoryId !== 'ALL') {
      filter.categoryId = params.categoryId;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { productCode: searchRegex },
      ];
    }

    if (params.lowStock) {
      filter.$expr = { $lte: ['$stockQuantity', '$minimumStock'] };
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 100;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name code')
        .populate('supplierId', 'name')
        .populate('brandId', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return Product.findById(id).populate('categoryId supplierId brandId');
  }

  static async getByBarcode(barcode: string) {
    return Product.findOne({ barcode, status: 'Active' });
  }

  static async create(data: Partial<IProduct>, user?: any) {
    // Fill categoryName / supplierName / brandName if id provided
    if (data.categoryId) {
      const cat = await Category.findById(data.categoryId);
      if (cat) data.categoryName = cat.name;
    }
    if (data.supplierId) {
      const sup = await Supplier.findById(data.supplierId);
      if (sup) data.supplierName = sup.name;
    }
    if (data.brandId) {
      const br = await Brand.findById(data.brandId);
      if (br) data.brandName = br.name;
    }

    const product = await Product.create(data);

    await AuditService.log({
      userId: user?.id,
      userName: user?.fullName || 'BackOffice',
      userRole: user?.role,
      action: 'CREATE_PRODUCT',
      module: 'PRODUCTS',
      description: `Created product: ${product.name} (SKU: ${product.sku}, Stock: ${product.stockQuantity})`,
      details: { productId: product._id, sku: product.sku },
    });

    broadcastEvent('PRODUCT_CREATED', product);
    return product;
  }

  static async update(id: string, data: Partial<IProduct>, user?: any) {
    const existing = await Product.findById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    if (data.categoryId) {
      const cat = await Category.findById(data.categoryId);
      if (cat) data.categoryName = cat.name;
    }
    if (data.supplierId) {
      const sup = await Supplier.findById(data.supplierId);
      if (sup) data.supplierName = sup.name;
    }
    if (data.brandId) {
      const br = await Brand.findById(data.brandId);
      if (br) data.brandName = br.name;
    }

    const updated = await Product.findByIdAndUpdate(id, data, { new: true });

    await AuditService.log({
      userId: user?.id,
      userName: user?.fullName || 'BackOffice',
      userRole: user?.role,
      action: 'UPDATE_PRODUCT',
      module: 'PRODUCTS',
      description: `Updated product: ${existing.name}`,
      details: { productId: id, changes: data },
    });

    broadcastEvent('PRODUCT_UPDATED', updated);
    return updated;
  }

  static async delete(id: string, user?: any) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Soft delete/deactivate to preserve sales history
    product.status = 'Inactive';
    await product.save();

    await AuditService.log({
      userId: user?.id,
      userName: user?.fullName || 'BackOffice',
      userRole: user?.role,
      action: 'DELETE_PRODUCT',
      module: 'PRODUCTS',
      description: `Deactivated product: ${product.name}`,
      details: { productId: id },
    });

    broadcastEvent('PRODUCT_DELETED', { id, name: product.name });
    return { success: true, message: 'Product deactivated successfully' };
  }
}
