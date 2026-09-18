import { create } from 'zustand';
import { soundService } from '../services/audio';

export interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  discount: number;
  tax: number;
  stockQuantity: number;
  minimumStock: number;
  unit: string;
  imageUrl: string;
  categoryName?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  lineDiscount: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  orderDiscount: number;
  
  addItem: (product: ProductItem, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (name: string, phone?: string) => void;
  setOrderDiscount: (discount: number) => void;
  
  // Computed values
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotalTax: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: 'Walk-in Customer',
  customerPhone: '',
  orderDiscount: 0,

  addItem: (product: ProductItem, quantity = 1) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((i) => i.product._id === product._id);

    if (existingIndex > -1) {
      const existing = currentItems[existingIndex];
      const newQty = existing.quantity + quantity;

      if (newQty > product.stockQuantity) {
        soundService.playErrorBuzz();
        return {
          success: false,
          message: `Cannot add more. Only ${product.stockQuantity} units available in stock.`,
        };
      }

      const updated = [...currentItems];
      updated[existingIndex] = { ...existing, quantity: newQty };
      soundService.playScanBeep();
      set({ items: updated });
      return { success: true };
    } else {
      if (quantity > product.stockQuantity) {
        soundService.playErrorBuzz();
        return {
          success: false,
          message: `Cannot add item. Only ${product.stockQuantity} units available in stock.`,
        };
      }

      soundService.playScanBeep();
      set({
        items: [...currentItems, { product, quantity, lineDiscount: product.discount || 0 }],
      });
      return { success: true };
    }
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return { success: true };
    }

    const currentItems = get().items;
    const item = currentItems.find((i) => i.product._id === productId);
    if (!item) return { success: false, message: 'Item not found' };

    if (quantity > item.product.stockQuantity) {
      soundService.playErrorBuzz();
      return {
        success: false,
        message: `Maximum available stock is ${item.product.stockQuantity} units.`,
      };
    }

    const updated = currentItems.map((i) =>
      i.product._id === productId ? { ...i, quantity } : i
    );
    soundService.playScanBeep();
    set({ items: updated });
    return { success: true };
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter((i) => i.product._id !== productId) });
  },

  clearCart: () => {
    set({ items: [], orderDiscount: 0, customerName: 'Walk-in Customer', customerPhone: '' });
  },

  setCustomer: (name: string, phone = '') => {
    set({ customerName: name, customerPhone: phone });
  },

  setOrderDiscount: (discount: number) => {
    set({ orderDiscount: Math.max(0, discount) });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  },

  getTotalDiscount: () => {
    const itemDiscounts = get().items.reduce((sum, item) => {
      const raw = item.product.sellingPrice * item.quantity;
      return sum + (raw * (item.lineDiscount || 0)) / 100;
    }, 0);
    return itemDiscounts + get().orderDiscount;
  },

  getTotalTax: () => {
    return get().items.reduce((sum, item) => {
      const raw = item.product.sellingPrice * item.quantity;
      const discount = (raw * (item.lineDiscount || 0)) / 100;
      const taxable = raw - discount;
      return sum + (taxable * (item.product.tax || 0)) / 100;
    }, 0);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getTotalDiscount();
    const tax = get().getTotalTax();
    return Math.max(0, subtotal - discount + tax);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
