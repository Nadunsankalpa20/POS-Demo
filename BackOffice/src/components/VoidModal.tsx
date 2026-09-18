import React, { useState } from 'react';
import { api } from '../services/api';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale: any | null;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sale,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for voiding this transaction.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.voidSale(sale._id, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to void sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Void Completed Invoice
              </h3>
              <p className="text-xs text-slate-400">Restore sold inventory to product stock</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleVoidSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              Voiding <span className="font-bold">{sale.invoiceNumber}</span> will immediately return{' '}
              <span className="font-bold">{sale.items?.length || 0} product item(s)</span> back to available stock.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Invoice:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Customer:</span>
              <span>{sale.customerName || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Amount:</span>
              <span className="font-bold text-emerald-500">Rs. {(sale.totalAmount || sale.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Reason for Void *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer returned goods, Cashier entered wrong tender..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
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
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <span>Voiding & Restoring...</span>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Void Sale</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
