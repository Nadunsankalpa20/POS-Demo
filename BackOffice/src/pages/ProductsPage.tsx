import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { exportToExcel, exportToCSV } from '../services/exporter';
import { ProductModal } from '../components/ProductModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts({
          search: search || undefined,
          categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        }),
        api.getCategories(),
      ]);
      setProducts(prodData.products || []);
      setCategories(catData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: any) => {
    if (window.confirm(`Are you sure you want to deactivate product '${product.name}'?`)) {
      try {
        await api.deleteProduct(product._id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to deactivate product');
      }
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const exportData = filteredProducts.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Barcode: p.barcode,
      Category: p.categoryName || 'General',
      Supplier: p.supplierName || 'General',
      CostPrice: p.costPrice,
      SellingPrice: p.sellingPrice,
      CurrentStock: p.stockQuantity,
      MinimumStock: p.minimumStock,
      Unit: p.unit,
      Status: p.status,
    }));

    if (format === 'excel') exportToExcel(exportData, 'Supermarket_Products');
    else exportToCSV(exportData, 'Supermarket_Products');
  };

  // Local Stock filter
  const filteredProducts = products.filter((p) => {
    if (stockFilter === 'LOW') return p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;
    if (stockFilter === 'OUT') return p.stockQuantity <= 0;
    if (stockFilter === 'IN') return p.stockQuantity > p.minimumStock;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Header with Title and Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Product Catalog Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create, update, manage SKUs, pricing and stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Export Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Title, SKU, or Barcode..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div className="w-full md:w-44">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN">In Stock Only</option>
            <option value="LOW">Low Stock (≤ threshold)</option>
            <option value="OUT">Out of Stock (0 units)</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4">Category</th>
                <th className="p-4">Cost Price</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading catalog items...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Product Image & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.unit}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="p-4 font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{p.sku}</div>
                        <div className="text-slate-400">{p.barcode}</div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-[11px]">
                          {p.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="p-4 font-mono text-slate-500">Rs. {p.costPrice.toFixed(2)}</td>

                      {/* Selling */}
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {p.sellingPrice.toFixed(2)}
                      </td>

                      {/* Stock Level Badge */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          {isOut ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 text-[10px]">
                              <XCircle className="w-3 h-3" /> 0 (Out of stock)
                            </span>
                          ) : isLow ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> {p.stockQuantity} (Low Stock)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> {p.stockQuantity} in stock
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Min: {p.minimumStock}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Deactivate product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        product={editingProduct}
      />
    </div>
  );
};
