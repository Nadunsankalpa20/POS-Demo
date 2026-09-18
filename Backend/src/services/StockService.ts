import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { StockMovement, MovementType } from '../models/StockMovement';
import { StockIn } from '../models/StockIn';
import { StockOut, StockOutReason } from '../models/StockOut';
import { Sale } from '../models/Sale';
import { AuditService } from './AuditService';
import { broadcastEvent } from '../config/socket';

export class StockService {
  static async stockIn(data: {
    productId: string;
    quantity: number;
    costPrice?: number;
    supplierId?: string;
    supplierName?: string;
    referenceNumber?: string;
    batchNumber?: string;
    expiryDate?: Date;
    notes?: string;
  }, user: any) {
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    const product = await Product.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + Number(data.quantity);
    const refNumber = data.referenceNumber || `STK-IN-${Date.now().toString().slice(-6)}`;
    const costPrice = data.costPrice !== undefined ? Number(data.costPrice) : product.costPrice;

    // Update product stock atomically
    product.stockQuantity = newStock;
    if (data.costPrice) {
      product.costPrice = costPrice;
    }
    await product.save();

    // Create StockIn record
    const stockInRecord = await StockIn.create({
      referenceNumber: refNumber,
      supplierId: data.supplierId || product.supplierId,
      supplierName: data.supplierName || product.supplierName || 'Direct Supplier',
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      quantity: data.quantity,
      costPrice: costPrice,
      totalCost: costPrice * data.quantity,
      batchNumber: data.batchNumber || '',
      expiryDate: data.expiryDate,
      notes: data.notes || '',
      receivedBy: user.id,
      receivedByName: user.fullName || user.username,
    });

    // Create Stock Movement
    const movement = await StockMovement.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      type: 'STOCK_IN',
      quantity: Number(data.quantity),
      previousStock,
      newStock,
      referenceId: refNumber,
      notes: data.notes || `Stock received from ${data.supplierName || 'supplier'}`,
      userId: user.id,
      userName: user.fullName || user.username,
    });

    await AuditService.log({
      userId: user.id,
      userName: user.fullName || user.username,
      userRole: user.role,
      action: 'STOCK_IN',
      module: 'STOCK',
      description: `Added ${data.quantity} units to ${product.name} (New Stock: ${newStock})`,
      details: { productId: product._id, quantity: data.quantity, refNumber },
    });

    // Broadcast real-time stock update
    broadcastEvent('STOCK_UPDATED', {
      productId: product._id.toString(),
      productName: product.name,
      previousStock,
      newStock,
      change: Number(data.quantity),
      movementType: 'STOCK_IN',
      movement,
    });

    return {
      product,
      stockIn: stockInRecord,
      movement,
    };
  }

  static async stockOut(data: {
    productId: string;
    quantity: number;
    reason: StockOutReason;
    notes?: string;
  }, user: any) {
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    const product = await Product.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stockQuantity < data.quantity) {
      throw new Error(`Insufficient stock. Current stock is ${product.stockQuantity}, cannot deduct ${data.quantity}`);
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock - Number(data.quantity);
    const refNumber = `STK-OUT-${Date.now().toString().slice(-6)}`;

    product.stockQuantity = newStock;
    await product.save();

    // Create StockOut record
    const stockOutRecord = await StockOut.create({
      referenceNumber: refNumber,
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes || '',
      performedBy: user.id,
      performedByName: user.fullName || user.username,
    });

    // Create Stock Movement
    const movement = await StockMovement.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      type: 'STOCK_OUT',
      quantity: -Number(data.quantity),
      previousStock,
      newStock,
      referenceId: refNumber,
      notes: `Reason: ${data.reason}. ${data.notes || ''}`.trim(),
      userId: user.id,
      userName: user.fullName || user.username,
    });

    await AuditService.log({
      userId: user.id,
      userName: user.fullName || user.username,
      userRole: user.role,
      action: 'STOCK_OUT',
      module: 'STOCK',
      description: `Deducted ${data.quantity} units from ${product.name} (Reason: ${data.reason}, New Stock: ${newStock})`,
      details: { productId: product._id, quantity: data.quantity, reason: data.reason, refNumber },
    });

    // Broadcast real-time stock update
    broadcastEvent('STOCK_UPDATED', {
      productId: product._id.toString(),
      productName: product.name,
      previousStock,
      newStock,
      change: -Number(data.quantity),
      movementType: 'STOCK_OUT',
      movement,
    });

    return {
      product,
      stockOut: stockOutRecord,
      movement,
    };
  }

  static async voidSale(saleId: string, reason: string, user: any) {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Sale record not found');
    }

    if (sale.status === 'VOIDED') {
      throw new Error('This sale is already voided');
    }

    // Return stock for all items
    const restoredItems = [];
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const previousStock = product.stockQuantity;
        const newStock = previousStock + item.quantity;
        product.stockQuantity = newStock;
        await product.save();

        const movement = await StockMovement.create({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          type: 'RETURN',
          quantity: item.quantity,
          previousStock,
          newStock,
          referenceId: sale.invoiceNumber,
          notes: `Voided Sale ${sale.invoiceNumber}. Reason: ${reason || 'Cashier request'}`,
          userId: user.id,
          userName: user.fullName || user.username,
        });

        broadcastEvent('STOCK_UPDATED', {
          productId: product._id.toString(),
          productName: product.name,
          previousStock,
          newStock,
          change: item.quantity,
          movementType: 'RETURN',
          movement,
        });

        restoredItems.push({
          productId: product._id,
          name: product.name,
          restoredQuantity: item.quantity,
          newStock,
        });
      }
    }

    sale.status = 'VOIDED';
    sale.voidReason = reason || 'Customer cancellation / void';
    sale.voidedAt = new Date();
    sale.voidedBy = user.id;
    await sale.save();

    await AuditService.log({
      userId: user.id,
      userName: user.fullName || user.username,
      userRole: user.role,
      action: 'VOID_SALE',
      module: 'SALES',
      description: `Voided Invoice ${sale.invoiceNumber} (Total: Rs. ${sale.total}). Restored inventory items.`,
      details: { saleId: sale._id, invoiceNumber: sale.invoiceNumber, reason },
    });

    broadcastEvent('SALE_VOIDED', {
      saleId: sale._id.toString(),
      invoiceNumber: sale.invoiceNumber,
      restoredItems,
    });

    return {
      sale,
      restoredItems,
    };
  }

  static async getMovements(params: {
    productId?: string;
    type?: MovementType;
    limit?: number;
    page?: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.productId) filter.productId = params.productId;
    if (params.type) filter.type = params.type;

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StockMovement.countDocuments(filter),
    ]);

    return { movements, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getLowStock() {
    return Product.find({
      status: 'Active',
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] },
    }).sort({ stockQuantity: 1 });
  }
}
