import { Sale } from '../models/Sale';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';

export class ReportService {
  /**
   * Get complete aggregated data for BackOffice Dashboard
   */
  static async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todaySalesAgg,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      allProductsForValuation,
      recentSales,
      recentMovements,
    ] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalDiscounts: { $sum: '$discount' },
            totalTax: { $sum: '$tax' },
            transactionsCount: { $sum: 1 },
          },
        },
      ]),
      Product.countDocuments({ status: 'Active' }),
      Product.countDocuments({
        status: 'Active',
        $expr: { $and: [{ $lte: ['$stockQuantity', '$minimumStock'] }, { $gt: ['$stockQuantity', 0] }] },
      }),
      Product.countDocuments({ status: 'Active', stockQuantity: { $lte: 0 } }),
      Product.find({ status: 'Active' }, 'stockQuantity costPrice sellingPrice categoryName').lean(),
      Sale.find().sort({ createdAt: -1 }).limit(8).lean(),
      StockMovement.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const todayStats = todaySalesAgg[0] || {
      totalRevenue: 0,
      totalDiscounts: 0,
      totalTax: 0,
      transactionsCount: 0,
    };

    // Calculate total inventory valuation
    let totalStockCostValue = 0;
    let totalStockRetailValue = 0;
    for (const p of allProductsForValuation) {
      totalStockCostValue += (p.stockQuantity || 0) * (p.costPrice || 0);
      totalStockRetailValue += (p.stockQuantity || 0) * (p.sellingPrice || 0);
    }

    // Daily sales trend for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesTrend = await Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 6 },
    ]);

    // Category distribution from products
    const categoryCounts: Record<string, number> = {};
    for (const p of allProductsForValuation) {
      const cat = p.categoryName || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      todayRevenue: todayStats.totalRevenue,
      todayDiscounts: todayStats.totalDiscounts,
      todayTax: todayStats.totalTax,
      todayTransactions: todayStats.transactionsCount,
      totalProducts,
      lowStockCount: lowStockProducts,
      outOfStockCount: outOfStockProducts,
      totalStockCostValue,
      totalStockRetailValue,
      recentSales,
      recentMovements,
      salesTrend,
      topProducts,
      categoryDistribution,
    };
  }

  /**
   * Detailed Sales Report
   */
  static async getSalesReport(filter: {
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: string;
  }) {
    const match: Record<string, any> = { status: 'COMPLETED' };

    if (filter.cashierId) match.cashierId = filter.cashierId;
    if (filter.paymentMethod) match.paymentMethod = filter.paymentMethod;

    if (filter.startDate || filter.endDate) {
      match.createdAt = {};
      if (filter.startDate) match.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const [sales, totals] = await Promise.all([
      Sale.find(match).sort({ createdAt: -1 }).lean(),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$subtotal' },
            totalDiscount: { $sum: '$discount' },
            totalTax: { $sum: '$tax' },
            totalNet: { $sum: '$total' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = totals[0] || {
      totalGross: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalNet: 0,
      invoiceCount: 0,
    };

    return { summary, sales };
  }

  /**
   * Detailed Product Sales Performance Report
   */
  static async getProductSalesReport(filter: { startDate?: string; endDate?: string }) {
    const match: Record<string, any> = { status: 'COMPLETED' };

    if (filter.startDate || filter.endDate) {
      match.createdAt = {};
      if (filter.startDate) match.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const report = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          barcode: { $first: '$items.barcode' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
          totalCost: { $sum: { $multiply: ['$items.quantity', '$items.costPrice'] } },
        },
      },
      {
        $project: {
          productName: 1,
          sku: 1,
          barcode: 1,
          quantitySold: 1,
          revenue: 1,
          totalCost: 1,
          grossProfit: { $subtract: ['$revenue', '$totalCost'] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return report;
  }

  /**
   * Stock Status Report
   */
  static async getStockReport() {
    const products = await Product.find({ status: 'Active' })
      .populate('categoryId', 'name')
      .populate('supplierId', 'name')
      .sort({ stockQuantity: 1 })
      .lean();

    const report = products.map((p) => {
      let status = 'IN STOCK';
      if (p.stockQuantity <= 0) status = 'OUT OF STOCK';
      else if (p.stockQuantity <= p.minimumStock) status = 'LOW STOCK';

      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.categoryName || 'General',
        currentStock: p.stockQuantity,
        minimumStock: p.minimumStock,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockValue: p.stockQuantity * p.costPrice,
        status,
      };
    });

    return report;
  }
}
