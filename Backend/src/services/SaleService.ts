import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Sale, ISale, PaymentMethod } from '../models/Sale';
import { StockMovement } from '../models/StockMovement';
import { AuditService } from './AuditService';
import { broadcastEvent } from '../config/socket';

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  customerName?: string;
  customerPhone?: string;
  discount?: number; // overall discount
  tax?: number; // overall tax
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentReference?: string;
}

export class SaleService {
  /**
   * Process a complete atomic sale transaction
   */
  static async checkout(input: CheckoutInput, cashier: any) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot checkout an empty cart. Please add items.');
    }

    if (input.paymentAmount === undefined || input.paymentAmount < 0) {
      throw new Error('Invalid payment amount provided.');
    }

    // Step 1: Pre-validate all products and quantities
    const productIds = input.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== input.items.length) {
      throw new Error('One or more products in your cart could not be found.');
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Step 2: Validate stock for every product BEFORE reducing any stock
    for (const item of input.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Quantity for all items must be greater than zero.');
      }

      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      if (product.status !== 'Active') {
        throw new Error(`Product '${product.name}' is currently inactive and cannot be sold.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient Stock: Only ${product.stockQuantity} units of '${product.name}' are available (Requested: ${item.quantity}).`
        );
      }
    }

    // Step 3: Compute calculations server-side
    let calculatedSubtotal = 0;
    let calculatedItemDiscounts = 0;
    let calculatedItemTaxes = 0;

    const saleItems = [];
    const stockUpdates: Array<{
      product: any;
      quantity: number;
      previousStock: number;
      newStock: number;
    }> = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.sellingPrice;
      const itemDiscountRate = item.discount !== undefined ? item.discount : product.discount || 0;
      const itemTaxRate = product.tax || 0;

      const rawTotal = unitPrice * item.quantity;
      const discountAmount = (rawTotal * itemDiscountRate) / 100;
      const taxableAmount = rawTotal - discountAmount;
      const taxAmount = (taxableAmount * itemTaxRate) / 100;
      const lineTotal = taxableAmount + taxAmount;

      calculatedSubtotal += rawTotal;
      calculatedItemDiscounts += discountAmount;
      calculatedItemTaxes += taxAmount;

      saleItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: item.quantity,
        unitPrice,
        costPrice: product.costPrice,
        discount: discountAmount,
        tax: taxAmount,
        lineTotal,
      });

      stockUpdates.push({
        product,
        quantity: item.quantity,
        previousStock: product.stockQuantity,
        newStock: product.stockQuantity - item.quantity,
      });
    }

    const overallDiscount = input.discount || 0;
    const finalDiscount = calculatedItemDiscounts + overallDiscount;
    const finalTax = calculatedItemTaxes + (input.tax || 0);
    const grandTotal = Math.max(0, calculatedSubtotal - finalDiscount + finalTax);

    if (input.paymentAmount < grandTotal && input.paymentMethod === 'CASH') {
      throw new Error(
        `Insufficient payment received. Total is Rs. ${grandTotal.toFixed(2)}, received Rs. ${input.paymentAmount.toFixed(2)}.`
      );
    }

    const change = input.paymentMethod === 'CASH' ? Math.max(0, input.paymentAmount - grandTotal) : 0;

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Step 4: Perform stock reduction atomically
    // Using atomic decrement with conditional stock check
    const decrementedProducts: string[] = [];
    try {
      for (const update of stockUpdates) {
        const result = await Product.findOneAndUpdate(
          {
            _id: update.product._id,
            stockQuantity: { $gte: update.quantity },
          },
          {
            $inc: { stockQuantity: -update.quantity },
          },
          { new: true }
        );

        if (!result) {
          throw new Error(
            `Stock conflict: Insufficient inventory for '${update.product.name}' during atomic deduction.`
          );
        }

        decrementedProducts.push(update.product._id.toString());
      }
    } catch (deductError: any) {
      // Rollback any already decremented products in this batch if a conflict occurred
      for (const update of stockUpdates) {
        if (decrementedProducts.includes(update.product._id.toString())) {
          await Product.findByIdAndUpdate(update.product._id, {
            $inc: { stockQuantity: update.quantity },
          });
        }
      }
      throw deductError;
    }

    // Step 5: Create Sale Record
    const sale = await Sale.create({
      invoiceNumber,
      cashierId: cashier.id,
      cashierName: cashier.fullName || cashier.username,
      customerName: input.customerName || 'Walk-in Customer',
      customerPhone: input.customerPhone || '',
      items: saleItems,
      subtotal: calculatedSubtotal,
      discount: finalDiscount,
      tax: finalTax,
      total: grandTotal,
      paymentMethod: input.paymentMethod,
      paymentAmount: input.paymentAmount,
      change,
      paymentReference: input.paymentReference || '',
      status: 'COMPLETED',
    });

    // Step 6: Create StockMovement records
    const createdMovements = [];
    for (const update of stockUpdates) {
      const movement = await StockMovement.create({
        productId: update.product._id,
        productName: update.product.name,
        sku: update.product.sku,
        type: 'SALE',
        quantity: -update.quantity,
        previousStock: update.previousStock,
        newStock: update.newStock,
        referenceId: invoiceNumber,
        notes: `POS Checkout Sale ${invoiceNumber} by ${cashier.username}`,
        userId: cashier.id,
        userName: cashier.fullName || cashier.username,
      });
      createdMovements.push(movement);

      // Real-time broadcast for every changed product
      broadcastEvent('STOCK_UPDATED', {
        productId: update.product._id.toString(),
        productName: update.product.name,
        previousStock: update.previousStock,
        newStock: update.newStock,
        change: -update.quantity,
        movementType: 'SALE',
        movement,
      });
    }

    // Step 7: Audit log & Sale Broadcast
    await AuditService.log({
      userId: cashier.id,
      userName: cashier.fullName || cashier.username,
      userRole: cashier.role,
      action: 'SALE_COMPLETED',
      module: 'SALES',
      description: `Completed Sale ${invoiceNumber}: ${saleItems.length} items, Total: Rs. ${grandTotal.toFixed(2)} (${input.paymentMethod})`,
      details: { saleId: sale._id, invoiceNumber, total: grandTotal },
    });

    broadcastEvent('SALE_COMPLETED', {
      sale,
      movements: createdMovements,
    });

    return sale;
  }

  static async getSales(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: string;
    status?: string;
    invoiceNumber?: string;
  }) {
    const filter: Record<string, any> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.cashierId) {
      filter.cashierId = params.cashierId;
    }

    if (params.paymentMethod) {
      filter.paymentMethod = params.paymentMethod;
    }

    if (params.invoiceNumber) {
      filter.invoiceNumber = new RegExp(params.invoiceNumber.trim(), 'i');
    }

    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) {
        filter.createdAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sale.countDocuments(filter),
    ]);

    return {
      sales,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSaleById(id: string) {
    return Sale.findById(id);
  }

  static async getSaleByInvoice(invoiceNumber: string) {
    return Sale.findOne({ invoiceNumber });
  }
}
