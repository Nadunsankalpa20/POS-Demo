const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('bo_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  // Dashboard
  async getDashboard() {
    const res = await fetch(`${API_URL}/reports/dashboard`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard metrics');
    return data.data;
  },

  // Products
  async getProducts(params?: { search?: string; categoryId?: string; status?: string; lowStock?: boolean; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.categoryId && params.categoryId !== 'ALL') sp.append('categoryId', params.categoryId);
    if (params?.status) sp.append('status', params.status);
    if (params?.lowStock) sp.append('lowStock', 'true');
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/products?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch products');
    return data;
  },

  async createProduct(productData: any) {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create product');
    return data.product;
  },

  async updateProduct(id: string, productData: any) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update product');
    return data.product;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to deactivate product');
    return data;
  },

  // Stock Operations
  async stockIn(payload: any) {
    const res = await fetch(`${API_URL}/stock/in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Stock In failed');
    return data;
  },

  async stockOut(payload: any) {
    const res = await fetch(`${API_URL}/stock/out`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Stock Out failed');
    return data;
  },

  async voidSale(saleId: string, reason: string) {
    const res = await fetch(`${API_URL}/stock/void/${saleId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Void sale failed');
    return data;
  },

  async getMovements(params?: { productId?: string; type?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.productId) sp.append('productId', params.productId);
    if (params?.type && params.type !== 'ALL') sp.append('type', params.type);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit || 50));

    const res = await fetch(`${API_URL}/stock/movements?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch movements');
    return data;
  },

  // Sales
  async getSales(params?: { page?: number; limit?: number; status?: string; invoiceNumber?: string; startDate?: string; endDate?: string }) {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit || 20));
    if (params?.status) sp.append('status', params.status);
    if (params?.invoiceNumber) sp.append('invoiceNumber', params.invoiceNumber);
    if (params?.startDate) sp.append('startDate', params.startDate);
    if (params?.endDate) sp.append('endDate', params.endDate);

    const res = await fetch(`${API_URL}/sales?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch sales');
    return data;
  },

  // Reports
  async getSalesReport(filter?: { startDate?: string; endDate?: string; cashierId?: string; paymentMethod?: string }) {
    const sp = new URLSearchParams();
    if (filter?.startDate) sp.append('startDate', filter.startDate);
    if (filter?.endDate) sp.append('endDate', filter.endDate);
    if (filter?.paymentMethod) sp.append('paymentMethod', filter.paymentMethod);

    const res = await fetch(`${API_URL}/reports/sales?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch sales report');
    return data;
  },

  async getProductPerformance(filter?: { startDate?: string; endDate?: string }) {
    const sp = new URLSearchParams();
    if (filter?.startDate) sp.append('startDate', filter.startDate);
    if (filter?.endDate) sp.append('endDate', filter.endDate);

    const res = await fetch(`${API_URL}/reports/products?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch product performance');
    return data.products;
  },

  async getStockReport() {
    const res = await fetch(`${API_URL}/reports/stock`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch stock report');
    return data.products;
  },

  // Categories & Suppliers
  async getCategories() {
    const res = await fetch(`${API_URL}/categories`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.categories || [];
  },

  async createCategory(payload: any) {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getSuppliers() {
    const res = await fetch(`${API_URL}/suppliers`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.suppliers || [];
  },

  async createSupplier(payload: any) {
    const res = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Users & Audit
  async getUsers() {
    const res = await fetch(`${API_URL}/auth/users`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.users || [];
  },

  async createUser(payload: any) {
    const res = await fetch(`${API_URL}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create user');
    return data.user;
  },

  async updateUser(id: string, payload: any) {
    const res = await fetch(`${API_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update user');
    return data.user;
  },

  async getAuditLogs(params?: { module?: string; action?: string; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.module) sp.append('module', params.module);
    if (params?.action) sp.append('action', params.action);
    if (params?.limit) sp.append('limit', String(params.limit || 100));

    const res = await fetch(`${API_URL}/audit?${sp.toString()}`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.logs || [];
  },
};
