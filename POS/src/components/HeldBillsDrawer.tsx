import React from 'react';
import { useHeldBillsStore, HeldBill } from '../store/heldBillsStore';
import { useCartStore } from '../store/cartStore';
import { X, BookmarkCheck, Play, Trash2, Clock, User } from 'lucide-react';

interface HeldBillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldBillsDrawer: React.FC<HeldBillsDrawerProps> = ({ isOpen, onClose }) => {
  const { heldBills, removeHeldBill, clearAll } = useHeldBillsStore();
  const { clearCart, addItem, setCustomer, setOrderDiscount } = useCartStore();

  if (!isOpen) return null;

  const handleResumeBill = (bill: HeldBill) => {
    clearCart();
    setCustomer(bill.customerName);
    setOrderDiscount(bill.orderDiscount);

    bill.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });

    removeHeldBill(bill.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-[#111827] border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                Held Bills ({heldBills.length})
              </h3>
              <p className="text-[11px] text-gray-400">Suspended customer orders</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {heldBills.length > 0 && (
              <button
                onClick={clearAll}
                className="px-2.5 py-1 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-bold transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldBills.length === 0 ? (
            <div className="text-center py-16">
              <BookmarkCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <div className="text-xs font-bold text-gray-500">No held orders right now</div>
              <p className="text-[11px] text-gray-400 mt-1">
                You can hold any active order by clicking "Hold" on the cart panel.
              </p>
            </div>
          ) : (
            heldBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-gray-100">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>{bill.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Held at {bill.heldAt}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                      Rs. {bill.total.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {bill.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="text-[11px] text-gray-500 line-clamp-1">
                  {bill.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => removeHeldBill(bill.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 transition-colors text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>

                  <button
                    onClick={() => handleResumeBill(bill)}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Resume Order</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
