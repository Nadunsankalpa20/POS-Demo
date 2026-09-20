/**
 * api.ts — Firebase Firestore adapter for BackOffice
 *
 * Keeps the exact same interface as the original REST api.ts so that
 * all BackOffice pages/components work without any changes.
 */
import {
  firebaseAuth,
  dashboardApi,
  productsApi,
  stockApi,
  salesApi,
  reportsApi,
  categoriesApi,
  suppliersApi,
  usersApi,
  auditApi,
} from './firestoreApi';

function normalize(doc: any) {
  return { ...doc, _id: doc.id };
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(username: string, password: string) {
    return firebaseAuth.login(username, password);
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboard() {
    return dashboardApi.getMetrics();
  },

  // ── Products ──────────────────────────────────────────────────────────────
  async getProducts(params?: { search?: string; categoryId?: string; status?: string; lowStock?: boolean; page?: number; limit?: number }) {
    const result = await productsApi.getAll({
      ...params,
      limitCount: params?.limit,
    });
    return {
      ...result,
      products: result.products.map(normalize),
    };
  },

  async createProduct(data: any) {
    const result = await productsApi.create(data);
    return normalize(result);
  },

  async updateProduct(id: string, data: any) {
    const result = await productsApi.update(id, data);
    return normalize(result);
  },

  async deleteProduct(id: string) {
    await productsApi.softDelete(id);
    return { success: true };
  },

  // ── Stock ─────────────────────────────────────────────────────────────────
  async stockIn(payload: any) {
    await stockApi.stockIn(payload);
    return { success: true };
  },

  async stockOut(payload: any) {
    await stockApi.stockOut(payload);
    return { success: true };
  },

  async voidSale(saleId: string, reason: string) {
    // userId and userName should come from the caller's auth context
    // Using a placeholder here — components should pass their own user info
    await stockApi.voidSale(saleId, reason, 'system', 'BackOffice User');
    return { success: true };
  },

  async getMovements(params?: { productId?: string; type?: string; page?: number; limit?: number }): Promise<any> {
    const data = await stockApi.getMovements({ ...params, limitCount: params?.limit });
    const movements = (data.movements || []).map((m: any) => ({
      _id: m.id,
      type: m.type === 'STOCK_IN' ? 'IN' : m.type === 'STOCK_OUT' ? 'OUT' : m.type,
      productId: {
        _id: m.productId || '',
        name: m.productName || 'Unknown Product',
        barcode: m.sku || '',
      },
      quantity: Math.abs(m.quantity || 0),
      reference: m.referenceId || m.reference || '',
      notes: m.notes || '',
      performedBy: {
        fullName: m.userName || '',
        username: m.userId || '',
      },
      createdAt: m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : (m.createdAt || new Date().toISOString()),
      ...m,
    }));
    return {
      movements,
      totalPages: 1,
      total: movements.length,
    };
  },

  // ── Sales ─────────────────────────────────────────────────────────────────
  async getSales(params?: { page?: number; limit?: number; status?: string; invoiceNumber?: string; startDate?: string; endDate?: string }) {
    return salesApi.getAll({ ...params, limitCount: params?.limit });
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  async getSalesReport(filter?: { startDate?: string; endDate?: string; cashierId?: string; paymentMethod?: string }) {
    return reportsApi.getSalesReport(filter);
  },

  async getProductPerformance(filter?: { startDate?: string; endDate?: string }) {
    return reportsApi.getProductPerformance(filter);
  },

  async getStockReport() {
    return reportsApi.getStockReport();
  },

  // ── Categories ────────────────────────────────────────────────────────────
  async getCategories(): Promise<any[]> {
    const cats = await categoriesApi.getAll();
    return cats.map(normalize);
  },

  async createCategory(payload: any) {
    return categoriesApi.create(payload);
  },

  // ── Suppliers ─────────────────────────────────────────────────────────────
  async getSuppliers(): Promise<any[]> {
    const sups = await suppliersApi.getAll();
    return sups.map(normalize);
  },

  async createSupplier(payload: any) {
    return suppliersApi.create(payload);
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  async getUsers() {
    const users = await usersApi.getAll();
    return users.map(normalize);
  },

  async createUser(payload: any) {
    const user = await usersApi.create(payload);
    return normalize(user);
  },

  async updateUser(id: string, payload: any) {
    const user = await usersApi.update(id, payload);
    return normalize(user);
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(params?: { module?: string; action?: string; limit?: number }): Promise<any[]> {
    const logs = await auditApi.getAll({ ...params, limitCount: params?.limit });
    return logs.map((log: any) => ({
      _id: log.id,
      action: log.action || '',
      module: log.module || '',
      details: log.description || log.details || '',
      performedBy: {
        fullName: log.userName || '',
        username: log.userId || '',
      },
      createdAt: log.createdAt?.toDate ? log.createdAt.toDate().toISOString() : (log.createdAt || new Date().toISOString()),
      ...log,
    }));
  },
};
