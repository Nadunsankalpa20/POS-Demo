import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useHeldBillsStore } from '../store/heldBillsStore';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  CreditCard,
  User,
  Tag,
  ReceiptText,
} from 'lucide-react';

interface CartProps {
  onOpenCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ onOpenCheckout }) => {
  const {
    items,
    customerName,
    setCustomer,
    updateQuantity,
    removeItem,
    clearCart,
    orderDiscount,
    setOrderDiscount,
    getSubtotal,
    getTotalDiscount,
    getTotalTax,
    getGrandTotal,
    getItemCount,
  } = useCartStore();

  const { holdCurrentBill } = useHeldBillsStore();
  const [discountInput, setDiscountInput] = useState<string>(orderDiscount ? String(orderDiscount) : '');
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const totalTax = getTotalTax();
  const grandTotal = getGrandTotal();
  const itemCount = getItemCount();

  const handleHoldBill = () => {
    if (items.length === 0) return;
    holdCurrentBill(items, customerName, orderDiscount, grandTotal);
    clearCart();
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) {
      setOrderDiscount(val);
      setShowDiscountInput(false);
    }
  };

  return (
    <div className="w-full xl:w-[420px] h-full flex flex-col ios-glass-panel border-l border-white/10 shadow-2xl z-20 transition-colors">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span>Current Order</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-mono font-bold">
                {itemCount}
              </span>
            </h2>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleHoldBill}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1 transition-colors"
              title="Hold bill to serve another customer"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Hold</span>
            </button>
            <button
              onClick={clearCart}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors"
              title="Clear all cart items"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Customer Input Row */}
      <div className="px-4 py-2.5 bg-white/40 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Customer Name (e.g. Walk-in Customer)"
          className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-gray-200 focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3 animate-pulse">
              <ReceiptText className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Cart is Empty</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
              Scan product barcode or click items from the catalog to build an order.
            </p>
          </div>
        ) : (
          items.map(({ product, quantity, lineDiscount }) => {
            const raw = product.sellingPrice * quantity;
            const discountAmt = (raw * lineDiscount) / 100;
            const lineTotal = raw - discountAmt;

            return (
              <div
                key={product._id}
                className="p-3 rounded-2xl ios-glass-tile flex gap-3 group transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-gray-200 dark:bg-gray-800 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                  }}
                />

                {/* Info & Quantity controls */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                        Rs. {product.sellingPrice.toFixed(2)} × {quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        Rs. {lineTotal.toFixed(2)}
                      </div>
                      {lineDiscount > 0 && (
                        <div className="text-[10px] text-rose-500 font-bold">
                          -{lineDiscount}% off
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/50 dark:border-gray-700/40">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        className="w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(product._id)}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Checkout Footer */}
      <div className="p-4 bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-white/10 space-y-2.5">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-gray-400 font-medium">
          <span>Subtotal</span>
          <span className="font-mono font-bold text-slate-900 dark:text-gray-200">
            Rs. {subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount Row */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-gray-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Discount</span>
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
            >
              <Tag className="w-2.5 h-2.5" /> {orderDiscount > 0 ? 'Edit' : '+ Add'}
            </button>
          </div>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-500">
            -Rs. {totalDiscount.toFixed(2)}
          </span>
        </div>

        {/* Inline Discount Input Drawer */}
        {showDiscountInput && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 animate-fade-in">
            <span className="text-xs font-bold text-slate-500">Rs.</span>
            <input
              type="number"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs font-mono bg-transparent text-slate-900 dark:text-gray-100 focus:outline-none"
            />
            <button
              onClick={handleApplyDiscount}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
            >
              Apply
            </button>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-gray-400 font-medium">
          <span>Taxes (Estimated)</span>
          <span className="font-mono font-bold text-slate-900 dark:text-gray-200">
            Rs. {totalTax.toFixed(2)}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-green-pulse" />
              <span>Total Amount</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block">
              Rs. {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Big Checkout Trigger with Pulsing Green Glow */}
          <button
            disabled={items.length === 0}
            onClick={onOpenCheckout}
            className={`px-6 py-4 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 transition-all duration-300 shadow-xl active:scale-95 cursor-pointer ${
              items.length === 0
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                : 'ios-glass-button text-white shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 ring-2 ring-emerald-400/40 hover:scale-[1.02]'
            }`}
          >
            <CreditCard className="w-5 h-5 animate-pulse" />
            <span className="tracking-wide">PAY / CHECKOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
