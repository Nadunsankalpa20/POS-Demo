/**
 * api.ts — Firebase Firestore adapter
 *
 * This file keeps the same interface as the original REST api.ts so no
 * page or component code needs to change. All calls are now routed to
 * Firebase Firestore instead of the Node.js backend.
 */
import { firebaseAuth, productsApi, categoriesApi, salesApi } from './firestoreApi';

/** Normalize a Firestore doc (id field) to match the old MongoDB _id shape */
function normalizeProduct(p: any) {
  return { ...p, _id: p.id };
}

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────

  async login(username: string, password: string) {
    return firebaseAuth.login(username, password);
  },

  // ── Products ─────────────────────────────────────────────────────────────

  async getProducts(params?: { search?: string; categoryId?: string; status?: string }) {
    const result = await productsApi.getAll(params);
    return {
      ...result,
      products: result.products.map(normalizeProduct),
    };
  },

  async getProductByBarcode(barcode: string) {
    const product = await productsApi.getByBarcode(barcode);
    return normalizeProduct(product);
  },

  // ── Categories ───────────────────────────────────────────────────────────

  async getCategories(): Promise<any[]> {
    return categoriesApi.getAll();
  },

  // ── Sales ─────────────────────────────────────────────────────────────────

  async checkout(salePayload: any): Promise<any> {
    return salesApi.checkout(salePayload);
  },

  async getSalesHistory(params?: { cashierId?: string; page?: number; limit?: number }) {
    return salesApi.getHistory({
      cashierId: params?.cashierId,
      limitCount: params?.limit,
    });
  },

  async getSaleByInvoice(invoiceNumber: string) {
    return salesApi.getByInvoice(invoiceNumber);
  },
};
