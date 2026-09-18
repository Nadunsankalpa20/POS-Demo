import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useShiftStore } from '../store/shiftStore';
import { api } from '../services/api';
import { soundService } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Banknote,
  CreditCard,
  QrCode,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleData: any) => void;
}

type PaymentType = 'CASH' | 'CARD' | 'QR' | 'OTHER';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    items,
    customerName,
    customerPhone,
    orderDiscount,
    getSubtotal,
    getTotalDiscount,
    getTotalTax,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const discount = getTotalDiscount();
  const tax = getTotalTax();
  const total = getGrandTotal();

  const numCashReceived = parseFloat(cashReceived) || 0;
  const change = Math.max(0, numCashReceived - total);
  const isCashSufficient = paymentMethod !== 'CASH' || numCashReceived >= total;

  const handleQuickCash = (amount: number) => {
    setCashReceived(String(amount));
  };

  const handleAddCash = (amount: number) => {
    const current = parseFloat(cashReceived) || 0;
    setCashReceived(String(current + amount));
  };

  const handleCheckoutSubmit = async () => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Cart is empty.');
      return;
    }

    if (paymentMethod === 'CASH' && numCashReceived < total) {
      soundService.playErrorBuzz();
      setErrorMessage(`Insufficient cash received. Minimum required: Rs. ${total.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discount: item.lineDiscount,
        })),
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        discount: orderDiscount,
        tax,
        paymentMethod,
        paymentAmount: paymentMethod === 'CASH' ? numCashReceived : total,
        paymentReference,
      };

      const sale = await api.checkout(payload);

      // Record sale in active cashier shift
      try {
        useShiftStore.getState().recordSale(Number(sale.total || total), paymentMethod);
      } catch (e) {
        console.error('Failed to update shift sale record:', e);
      }

      // Trigger Celebration & Sound
      soundService.playCheckoutSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      clearCart();
      onSuccess(sale);
    } catch (err: any) {
      soundService.playErrorBuzz();
      setErrorMessage(err.message || 'Checkout failed. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl ios-glass-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Complete Payment & Checkout</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Select payment tender and confirm transaction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Due Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Amount Payable
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
                Rs. {total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Subtotal: Rs. {subtotal.toFixed(2)} | Discount: Rs. {discount.toFixed(2)} | Tax: Rs. {tax.toFixed(2)}
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
              {items.length} Line Items
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Select Payment Tender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote, color: 'text-emerald-500' },
                { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard, color: 'text-cyan-500' },
                { id: 'QR', label: 'Digital QR', icon: QrCode, color: 'text-amber-500' },
                { id: 'OTHER', label: 'Other', icon: Layers, color: 'text-purple-500' },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id as PaymentType);
                      if (method.id === 'CASH' && !cashReceived) {
                        setCashReceived(String(Math.ceil(total)));
                      }
                    }}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all duration-200 card-3d ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 scale-105'
                        : 'bg-white dark:bg-[#161f30] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${method.color}`} />
                    <span className="text-xs font-extrabold">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tender Input & Change Calculation */}
          {paymentMethod === 'CASH' && (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Cash Tendered Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-lg font-mono font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:w-48 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                    Change Due
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    Rs. {change.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-400 font-semibold mr-1">Quick Tender:</span>
                <button
                  type="button"
                  onClick={() => handleQuickCash(total)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-xs font-bold text-emerald-500 transition-colors"
                >
                  Exact (Rs. {total.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(100)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(500)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(1000)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCash(5000)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  +5,000
                </button>
              </div>
            </div>
          )}

          {/* Card / Reference Tender */}
          {paymentMethod === 'CARD' && (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                POS Terminal Transaction Approval / Reference Code
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN-948218 (or swipe/tap on external terminal)"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-cyan-500"
              />
              <div className="text-[11px] text-gray-400">
                Please ensure external card reader shows "APPROVED" before confirming.
              </div>
            </div>
          )}

          {/* Digital QR Tender */}
          {paymentMethod === 'QR' && (
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center space-y-3">
              {/* Simulated QR Code SVG */}
              <div className="w-44 h-44 bg-white p-3 rounded-2xl border-2 border-emerald-500 shadow-xl flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="25" height="25" fill="#000" />
                  <rect x="10" y="10" width="15" height="15" fill="#fff" />
                  <rect x="14" y="14" width="7" height="7" fill="#000" />

                  <rect x="70" y="5" width="25" height="25" fill="#000" />
                  <rect x="75" y="10" width="15" height="15" fill="#fff" />
                  <rect x="79" y="14" width="7" height="7" fill="#000" />

                  <rect x="5" y="70" width="25" height="25" fill="#000" />
                  <rect x="10" y="75" width="15" height="15" fill="#fff" />
                  <rect x="14" y="79" width="7" height="7" fill="#000" />

                  {/* QR Pattern Data Dots */}
                  <circle cx="45" cy="15" r="3" fill="#10b981" />
                  <circle cx="55" cy="20" r="3" fill="#000" />
                  <circle cx="40" cy="35" r="3" fill="#000" />
                  <circle cx="50" cy="45" r="4" fill="#10b981" />
                  <circle cx="60" cy="40" r="3" fill="#000" />
                  <circle cx="35" cy="55" r="3" fill="#000" />
                  <circle cx="65" cy="65" r="4" fill="#10b981" />
                  <circle cx="45" cy="75" r="3" fill="#000" />
                  <circle cx="55" cy="85" r="3" fill="#000" />
                  <circle cx="75" cy="45" r="3" fill="#000" />
                  <circle cx="85" cy="55" r="3" fill="#10b981" />
                  <circle cx="80" cy="80" r="4" fill="#000" />
                </svg>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Scan to Pay Rs. {total.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                  UPI / LankaQR / Alipay / WeChat Pay
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-5 bg-slate-950/40 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl ios-glass-pill hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || !isCashSufficient}
            onClick={handleCheckoutSubmit}
            className={`px-8 py-3.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer ${
              isSubmitting || !isCashSufficient
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'ios-glass-button text-white shadow-emerald-500/30'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Sale...</span>
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRM & PRINT RECEIPT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
