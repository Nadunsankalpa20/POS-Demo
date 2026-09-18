import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { StockInModal } from '../components/StockInModal';
import { StockOutModal } from '../components/StockOutModal';
import { VoidModal } from '../components/VoidModal';
import {
  PackagePlus,
  PackageMinus,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Hash,
  Calendar,
  User,
} from 'lucide-react';

interface Movement {
  _id: string;
  type: 'IN' | 'OUT' | 'SALE' | 'VOID' | 'ADJUSTMENT';
  productId: { _id: string; name: string; barcode: string } | null;
  quantity: number;
  reference: string;
  notes: string;
  performedBy: { fullName?: string; username: string } | null;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  IN:         { label: 'Stock In',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: ArrowUp },
  OUT:        { label: 'Stock Out',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: ArrowDown },
  SALE:       { label: 'Sale',        color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       icon: TrendingDown },
  VOID:       { label: 'Void',        color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: XCircle },
  ADJUSTMENT: { label: 'Adjustment',  color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',   icon: RefreshCw },
};

// Wrapper: VoidModal with its own sale search
const VoidModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({
  isOpen, onClose, onSuccess,
}) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundSale, setFoundSale] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInvoiceSearch('');
      setFoundSale(null);
      setSearchError(null);
      setConfirmOpen(false);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;
    setSearching(true);
    setSearchError(null);
    setFoundSale(null);
    try {
      const data = await api.getSales({ invoiceNumber: invoiceSearch.trim(), status: 'COMPLETED', limit: 1 });
      const sales = data.sales || [];
      if (sales.length === 0) {
        setSearchError('No completed sale found with that invoice number.');
      } else {
        setFoundSale(sales[0]);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  if (confirmOpen && foundSale) {
    return (
      <VoidModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSuccess={() => { onSuccess(); onClose(); }}
        sale={foundSale}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            Void a Sale
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">Enter the invoice number to look up the sale you want to void.</p>
          <div className="flex gap-2">
            <input
              id="void-invoice-search"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="e.g. INV-20260918-001"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 transition-all"
            >
              {searching ? '…' : 'Find'}
            </button>
          </div>
          {searchError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{searchError}</p>
          )}
          {foundSale && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-bold text-slate-300">Found Sale:</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>Invoice:</span><span className="font-mono text-slate-200">{foundSale.invoiceNumber}</span></div>
                <div className="flex justify-between"><span>Total:</span><span className="font-bold text-emerald-400">${(foundSale.totalAmount || foundSale.total || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{new Date(foundSale.createdAt).toLocaleDateString()}</span></div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                Proceed to Void
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export const StockPage: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mvData, prodData] = await Promise.all([
        api.getMovements({
          type: filterType === 'ALL' ? undefined : filterType,
          page,
          limit: 50,
        }),
        api.getProducts({ limit: 500 }),
      ]);
      setMovements(mvData.movements || []);
      setTotalPages(mvData.totalPages || 1);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = movements.filter((m) => {
    if (!search) return true;
    const name = m.productId?.name?.toLowerCase() || '';
    const ref = m.reference?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || ref.includes(search.toLowerCase());
  });

  const handleSuccess = () => {
    setIsStockInOpen(false);
    setIsStockOutOpen(false);
    setIsVoidOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100">Stock Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage incoming, outgoing stock and void transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="stock-in-btn"
            onClick={() => setIsStockInOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/25"
          >
            <PackagePlus className="w-4 h-4" />
            Stock In
          </button>
          <button
            id="stock-out-btn"
            onClick={() => setIsStockOutOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-amber-600/25"
          >
            <PackageMinus className="w-4 h-4" />
            Stock Out
          </button>
          <button
            id="void-sale-btn"
            onClick={() => setIsVoidOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-rose-600/25"
          >
            <XCircle className="w-4 h-4" />
            Void Sale
          </button>
          <button
            id="refresh-movements-btn"
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="stock-search"
            type="text"
            placeholder="Search product or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {['ALL', 'IN', 'OUT', 'SALE', 'VOID', 'ADJUSTMENT'].map((t) => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow shadow-blue-600/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold text-left">
                <th className="px-4 py-3"><Hash className="w-3.5 h-3.5 inline mr-1" />Type</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3"><User className="w-3.5 h-3.5 inline mr-1" />By</th>
                <th className="px-4 py-3"><Calendar className="w-3.5 h-3.5 inline mr-1" />Date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-slate-800 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    No movements found
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const cfg = typeConfig[m.type] || typeConfig['ADJUSTMENT'];
                  const Icon = cfg.icon;
                  return (
                    <tr key={m._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-semibold">
                        {m.productId?.name || <span className="text-slate-600 italic">Deleted product</span>}
                        {m.productId?.barcode && (
                          <span className="text-slate-500 font-mono text-[10px] ml-1.5">#{m.productId.barcode}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-bold font-mono ${
                        m.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{m.reference}</td>
                      <td className="px-4 py-3 text-slate-400">{m.performedBy?.fullName || m.performedBy?.username || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(m.createdAt).toLocaleString('en-US', {
                          month: 'short', day: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={m.notes}>{m.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold disabled:opacity-40 hover:bg-slate-700 transition-all"
              >Prev</button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold disabled:opacity-40 hover:bg-slate-700 transition-all"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StockInModal isOpen={isStockInOpen} onClose={() => setIsStockInOpen(false)} onSuccess={handleSuccess} products={products} />
      <StockOutModal isOpen={isStockOutOpen} onClose={() => setIsStockOutOpen(false)} onSuccess={handleSuccess} products={products} />
      <VoidModalWrapper isOpen={isVoidOpen} onClose={() => setIsVoidOpen(false)} onSuccess={handleSuccess} />
    </div>
  );
};
