import { create } from 'zustand';

export interface ShiftState {
  isShiftActive: boolean;
  shiftId: string | null;
  cashierId: string | null;
  cashierName: string | null;
  terminalId: string;
  laneNumber: string;
  signOnTime: string | null;
  openingFloat: number; // Starting money in locker / cash drawer
  lockerId: string;
  cashSales: number;
  cardSales: number;
  qrSales: number;
  totalTransactions: number;
  notes: string;

  // Actions
  signOn: (params: {
    openingFloat: number;
    lockerId: string;
    cashierId?: string;
    cashierName?: string;
    terminalId?: string;
    laneNumber?: string;
    notes?: string;
  }) => void;
  recordSale: (amount: number, paymentMethod: string) => void;
  signOff: (countedCash: number, notes?: string) => {
    expectedCash: number;
    countedCash: number;
    variance: number;
  };
  managerSignOff: (managerName: string, notes?: string) => void;
  resetShift: () => void;
}

const STORAGE_KEY = 'pos_shift_state';

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved shift state:', e);
  }
  return null;
};

const savedState = loadInitialState();

export const useShiftStore = create<ShiftState>((set, get) => ({
  isShiftActive: savedState?.isShiftActive || false,
  shiftId: savedState?.shiftId || null,
  cashierId: savedState?.cashierId || null,
  cashierName: savedState?.cashierName || null,
  terminalId: savedState?.terminalId || 'TERM-01',
  laneNumber: savedState?.laneNumber || 'Lane 01',
  signOnTime: savedState?.signOnTime || null,
  openingFloat: savedState?.openingFloat || 0,
  lockerId: savedState?.lockerId || 'Locker #01',
  cashSales: savedState?.cashSales || 0,
  cardSales: savedState?.cardSales || 0,
  qrSales: savedState?.qrSales || 0,
  totalTransactions: savedState?.totalTransactions || 0,
  notes: savedState?.notes || '',

  signOn: ({
    openingFloat,
    lockerId,
    cashierId = 'cashier',
    cashierName = 'Cashier 1',
    terminalId = 'TERM-01',
    laneNumber = 'Lane 01',
    notes = '',
  }) => {
    const shiftId = `SH-${Date.now().toString().slice(-6)}`;
    const signOnTime = new Date().toISOString();

    const newState = {
      isShiftActive: true,
      shiftId,
      cashierId,
      cashierName,
      terminalId,
      laneNumber,
      signOnTime,
      openingFloat,
      lockerId,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      totalTransactions: 0,
      notes,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    set(newState);
  },

  recordSale: (amount: number, paymentMethod: string) => {
    const s = get();
    if (!s.isShiftActive) return;

    let newCashSales = s.cashSales;
    let newCardSales = s.cardSales;
    let newQrSales = s.qrSales;

    const methodUpper = (paymentMethod || '').toUpperCase();
    if (methodUpper === 'CASH') {
      newCashSales += amount;
    } else if (methodUpper === 'CARD') {
      newCardSales += amount;
    } else {
      newQrSales += amount;
    }

    const updated = {
      ...s,
      cashSales: newCashSales,
      cardSales: newCardSales,
      qrSales: newQrSales,
      totalTransactions: s.totalTransactions + 1,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set(updated);
  },

  signOff: (countedCash: number, notes = '') => {
    const s = get();
    const expectedCash = s.openingFloat + s.cashSales;
    const variance = countedCash - expectedCash;

    const result = {
      expectedCash,
      countedCash,
      variance,
    };

    // Mark shift as closed
    const closed = {
      ...s,
      isShiftActive: false,
      notes: notes || s.notes,
    };

    localStorage.removeItem(STORAGE_KEY);
    set({
      isShiftActive: false,
      shiftId: null,
      signOnTime: null,
      openingFloat: 0,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      totalTransactions: 0,
    });

    return result;
  },

  managerSignOff: (_managerName: string, _notes = '') => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      isShiftActive: false,
      shiftId: null,
      signOnTime: null,
      openingFloat: 0,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      totalTransactions: 0,
      notes: '',
    });
  },

  resetShift: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      isShiftActive: false,
      shiftId: null,
      signOnTime: null,
      openingFloat: 0,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      totalTransactions: 0,
      notes: '',
    });
  },
}));
