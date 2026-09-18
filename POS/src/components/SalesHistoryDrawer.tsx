import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { X, History, Printer, Search, ArrowRight, RefreshCw, FileText } from 'lucide-react';

interface SalesHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSale: (sale: any) => void;
}

export const SalesHistoryDrawer: React.FC<SalesHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSale,
}) => {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchInvoice, setSearchInvoice] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSales();
    }
  }, [isOpen]);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSalesHistory({ cashierId: user?.id, limit: 30 });
      setSales(data.sales || []);
    } catch (e) {
      console.error('Failed to load sales history', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSales = sales.filter((s) =>
    !searchInvoice ||
    s.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
    (s.customerName && s.customerName.toLowerCase().includes(searchInvoice.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-[#111827] border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                Shift Sales History
              </h3>
              <p className="text-[11px] text-gray-400">Cashier: {user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadSales}
              className="p-2 rounded-xl text-gray-400 hover:text-cyan-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-50 dark:bg-[#161f30] border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="Search by invoice number or customer..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Sales List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-gray-400">Loading recent sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <div className="text-xs font-bold text-gray-500">No sales records found</div>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div
                key={sale._id}
                className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 hover:border-cyan-500/40 transition-all shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-gray-100 font-mono">
                      {sale.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.customerName || 'Walk-in'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                      Rs. {sale.total.toFixed(2)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-gray-500">
                    {sale.items?.length || 0} items ({sale.paymentMethod})
                  </span>

                  <button
                    onClick={() => {
                      onSelectSale(sale);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3 h-3" />
                    <span>View / Reprint</span>
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
