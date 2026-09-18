import { create } from 'zustand';
import { CartItem } from './cartStore';

export interface HeldBill {
  id: string;
  heldAt: string;
  customerName: string;
  items: CartItem[];
  orderDiscount: number;
  total: number;
}

interface HeldBillsState {
  heldBills: HeldBill[];
  holdCurrentBill: (items: CartItem[], customerName: string, orderDiscount: number, total: number) => void;
  removeHeldBill: (id: string) => void;
  clearAll: () => void;
}

export const useHeldBillsStore = create<HeldBillsState>((set, get) => ({
  heldBills: JSON.parse(localStorage.getItem('pos_held_bills') || '[]'),

  holdCurrentBill: (items, customerName, orderDiscount, total) => {
    if (items.length === 0) return;
    const newBill: HeldBill = {
      id: `HOLD-${Date.now()}`,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      customerName: customerName || 'Walk-in Customer',
      items,
      orderDiscount,
      total,
    };
    const updated = [newBill, ...get().heldBills];
    localStorage.setItem('pos_held_bills', JSON.stringify(updated));
    set({ heldBills: updated });
  },

  removeHeldBill: (id) => {
    const updated = get().heldBills.filter((b) => b.id !== id);
    localStorage.setItem('pos_held_bills', JSON.stringify(updated));
    set({ heldBills: updated });
  },

  clearAll: () => {
    localStorage.removeItem('pos_held_bills');
    set({ heldBills: [] });
  },
}));
