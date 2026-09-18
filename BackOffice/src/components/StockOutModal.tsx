import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: any[];
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
}) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('DAMAGED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (products.length > 0 && !productId) {
        setProductId(products[0]._id);
      }
      setQuantity('1');
      setReason('DAMAGED');
      setNotes('');
      setError(null);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p._id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!productId || qty <= 0) {
      setError('Please select a product and valid quantity');
      return;
    }

    if (selectedProduct && qty > selectedProduct.stockQuantity) {
      setError(`Cannot deduct ${qty} units. Current stock is only ${selectedProduct.stockQuantity}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.stockOut({
        productId,
        quantity: qty,
        reason: reason as any,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Stock Out operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Stock Out Entry (Write-Off / Adjustment)
              </h3>
              <p className="text-xs text-slate-400">Deduct damaged, expired, or adjusted items</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Stock: {p.stockQuantity} {p.unit})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="text-[11px] text-slate-500 mt-1">
                Available: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.stockQuantity} units</span> → Remaining after: <span className="font-bold text-rose-500">{Math.max(0, selectedProduct.stockQuantity - (Number(quantity) || 0))} units</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Quantity to Deduct *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Deduction Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="DAMAGED">Damaged Goods</option>
                <option value="EXPIRED">Expired Stock</option>
                <option value="LOST">Lost / Missing</option>
                <option value="INTERNAL_USAGE">Internal Store Usage</option>
                <option value="MANUAL_ADJUSTMENT">Manual Inventory Count Adjustment</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Detailed Notes / Reason Explanation
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Can crushed during customer inspection"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Stock Out</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
