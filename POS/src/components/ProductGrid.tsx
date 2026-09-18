import React, { useState, useEffect } from 'react';
import { ProductItem, useCartStore } from '../store/cartStore';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';
import { soundService } from '../services/audio';
import {
  Search,
  Barcode,
  Sparkles,
  Layers,
  X,
  RefreshCw,
  AlertCircle,
  ScanLine,
} from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  code: string;
}

interface ProductGridProps {
  products: ProductItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onScanBarcode: (barcode: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onRefresh,
  onScanBarcode,
}) => {
  const { addItem } = useCartStore();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      const result = addItem(matched, 1);
      if (result.success) {
        setScanMessage({ text: `✓ Added ${matched.name}` });
      } else {
        setScanMessage({ text: result.message || 'Cannot add product', isError: true });
      }
    } else {
      soundService.playErrorBuzz();
      setScanMessage({ text: `Product not found for barcode: ${barcodeInput}`, isError: true });
    }

    setBarcodeInput('');
    setTimeout(() => setScanMessage(null), 3000);
  };

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (product.categoryName && product.categoryName.toLowerCase() === selectedCategory.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.barcode.includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-[#0b0f19] p-4 lg:p-6">
      {/* Search & Barcode Entry Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        {/* Live Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by Name, SKU, Barcode, Code..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl ios-glass-input text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Direct Barcode Entry & Hardware Scanner Input with Live Green Laser */}
        <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-80 overflow-hidden rounded-2xl">
          <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 z-10" />
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode [Enter]..."
            className="w-full pl-10 pr-20 py-2.5 rounded-2xl ios-glass-input text-sm font-mono text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition-all shadow-sm"
          />
          {/* Animated Green Laser Scan Line */}
          <div className="animate-laser-line" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl ios-glass-button text-white text-[11px] font-bold transition-all cursor-pointer z-10"
          >
            Enter
          </button>
        </form>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-2xl ios-glass-pill hover:bg-white/40 dark:hover:bg-white/15 text-slate-700 dark:text-gray-300 hover:text-emerald-500 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Refresh products & stock"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
        </button>
      </div>

      {/* Live Store Telemetry Stream Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl ios-glass-pill mb-3 text-[11px] font-mono border-emerald-500/25">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold tracking-wide uppercase">
            LIVE CATALOG FEED
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 dark:text-slate-400">
            {products.length} Products Synced
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-green-pulse" />
          <span>LASER SCANNER ACTIVE</span>
        </div>
      </div>

      {/* Barcode Quick Scan Simulator Bar */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-xs text-slate-500 dark:text-gray-400">
        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          <ScanLine className="w-3.5 h-3.5" /> Quick Scan:
        </span>
        <button
          type="button"
          onClick={() => onScanBarcode('890103000001')}
          className="px-2.5 py-1 rounded-xl ios-glass-pill text-slate-700 dark:text-emerald-300 font-mono text-[11px] hover:border-emerald-500/50 whitespace-nowrap transition-colors cursor-pointer"
        >
          🥤 Coke (890103000001)
        </button>
        <button
          type="button"
          onClick={() => onScanBarcode('890103000006')}
          className="px-2.5 py-1 rounded-xl ios-glass-pill text-slate-700 dark:text-amber-300 font-mono text-[11px] hover:border-amber-500/50 whitespace-nowrap transition-colors cursor-pointer"
        >
          🍞 Bread (890103000006)
        </button>
        <button
          type="button"
          onClick={() => onScanBarcode('890103000009')}
          className="px-2.5 py-1 rounded-xl ios-glass-pill text-slate-700 dark:text-cyan-300 font-mono text-[11px] hover:border-cyan-500/50 whitespace-nowrap transition-colors cursor-pointer"
        >
          🥛 Milk (890103000009)
        </button>
        <button
          type="button"
          onClick={() => onScanBarcode('890103000013')}
          className="px-2.5 py-1 rounded-xl ios-glass-pill text-slate-700 dark:text-pink-300 font-mono text-[11px] hover:border-pink-500/50 whitespace-nowrap transition-colors cursor-pointer"
        >
          🥔 Lays (890103000013)
        </button>
      </div>

      {/* Barcode Alert Banner */}
      {scanMessage && (
        <div
          className={`mb-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            scanMessage.isError
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{scanMessage.text}</span>
        </div>
      )}

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'ios-glass-button text-white scale-105 shadow-md shadow-emerald-500/30'
              : 'ios-glass-pill text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Items ({products.length})</span>
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryName === cat.name).length;
          return (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.name
                  ? 'ios-glass-button text-white scale-105 shadow-md shadow-emerald-500/30'
                  : 'ios-glass-pill text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid Area with Custom Scrollbar */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white dark:bg-[#161f30] border border-gray-200 dark:border-gray-800 p-3 flex flex-col justify-between animate-shimmer"
              >
                <div className="w-full h-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2 mt-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-400 mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">No Products Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              We couldn't find any products matching "{searchQuery}". Try adjusting your search or category filter.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
