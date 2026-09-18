const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pos_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
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

  async getProducts(params?: { search?: string; categoryId?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.categoryId && params.categoryId !== 'ALL') searchParams.append('categoryId', params.categoryId);
    searchParams.append('status', 'Active');
    searchParams.append('limit', '150');

    const res = await fetch(`${API_URL}/products?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch products');
    return data;
  },

  async getProductByBarcode(barcode: string) {
    const res = await fetch(`${API_URL}/products/barcode/${encodeURIComponent(barcode)}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Product not found');
    return data.product;
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch categories');
    return data.categories;
  },

  async checkout(salePayload: any) {
    const res = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(salePayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Checkout failed');
    return data.sale;
  },

  async getSalesHistory(params?: { cashierId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.cashierId) searchParams.append('cashierId', params.cashierId);
    searchParams.append('limit', String(params?.limit || 25));

    const res = await fetch(`${API_URL}/sales?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch sales history');
    return data;
  },

  async getSaleByInvoice(invoiceNumber: string) {
    const res = await fetch(`${API_URL}/sales/invoice/${encodeURIComponent(invoiceNumber)}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invoice not found');
    return data.sale;
  },
};
