import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Package, DollarSign, Download,
  Calendar, RefreshCw, ChevronDown,
} from 'lucide-react';
import { exportToCSV as exportCSV } from '../services/exporter';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#ef4444'];

type DatePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

const presetRanges = (preset: DatePreset): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

export const ReportsPage: React.FC = () => {
  const [preset, setPreset] = useState<DatePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [salesData, setSalesData] = useState<any>(null);
  const [productPerf, setProductPerf] = useState<any[]>([]);
  const [stockReport, setStockReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'stock'>('sales');

  const getDateRange = useCallback(() => {
    if (preset === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return presetRanges(preset);
  }, [preset, customStart, customEnd]);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    const range = getDateRange();
    try {
      const [sales, products, stock] = await Promise.all([
        api.getSalesReport(range),
        api.getProductPerformance(range),
        api.getStockReport(),
      ]);
      setSalesData(sales);
      setProductPerf(products || []);
      setStockReport(stock || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleExportSales = () => {
    if (!salesData?.sales) return;
    exportCSV(
      salesData.sales.map((s: any) => ({
        Invoice: s.invoiceNumber,
        Date: new Date(s.createdAt).toLocaleDateString(),
        Total: s.totalAmount,
        Payment: s.paymentMethod,
        Cashier: s.cashierId?.fullName || s.cashierId?.username || 'N/A',
        Status: s.status,
      })),
      `sales-report-${getDateRange().startDate}-to-${getDateRange().endDate}`
    );
  };

  const handleExportProducts = () => {
    exportCSV(
      productPerf.map((p: any) => ({
        Product: p.name,
        Barcode: p.barcode,
        'Units Sold': p.totalSold,
        Revenue: p.totalRevenue,
        'Profit Margin': p.margin,
      })),
      `product-performance-${getDateRange().startDate}`
    );
  };

  const handleExportStock = () => {
    exportCSV(
      stockReport.map((p: any) => ({
        Product: p.name,
        Barcode: p.barcode,
        'Current Stock': p.stockQuantity,
        'Min Stock': p.minStockLevel,
        Status: p.stockStatus,
      })),
      `stock-report-${new Date().toISOString().split('T')[0]}`
    );
  };

  const summaryCards = salesData ? [
    {
      label: 'Total Revenue',
      value: `$${(salesData.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-500',
      glow: 'shadow-emerald-500/20',
    },
    {
      label: 'Total Transactions',
      value: (salesData.totalSales || 0).toLocaleString(),
      icon: TrendingUp,
      color: 'from-blue-600 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Avg. Order Value',
      value: `$${(salesData.avgOrderValue || 0).toFixed(2)}`,
      icon: Package,
      color: 'from-purple-600 to-violet-500',
      glow: 'shadow-purple-500/20',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', '7d', '30d', '90d'] as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                preset === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
          <button
            onClick={() => setPreset('custom')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              preset === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Custom
            <ChevronDown className="w-3 h-3" />
          </button>
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          )}
          <button
            id="refresh-reports-btn"
            onClick={loadReports}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />
          ))
        ) : (
          summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${card.color} shadow-xl ${card.glow}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white/70">{card.label}</p>
                    <p className="text-2xl font-black text-white mt-1">{card.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
              </div>
            );
          })
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl w-fit border border-slate-800">
        {[
          { id: 'sales',    label: 'Sales' },
          { id: 'products', label: 'Product Performance' },
          { id: 'stock',    label: 'Stock Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {/* Revenue Chart */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200">Revenue Over Time</h3>
              <button
                id="export-sales-csv"
                onClick={handleExportSales}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
            {isLoading ? (
              <div className="h-56 rounded-xl bg-slate-800 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesData?.dailySales || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Methods */}
          {!isLoading && salesData?.paymentBreakdown && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Payment Methods</h3>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(salesData.paymentBreakdown).map(([k, v]: any) => ({ name: k, value: v }))}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {Object.keys(salesData.paymentBreakdown).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Top Performing Products</h3>
            <button
              id="export-products-csv"
              onClick={handleExportProducts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={productPerf.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="totalSold" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>

              <table className="w-full text-xs mt-4">
                <thead>
                  <tr className="text-slate-500 font-semibold border-b border-slate-800">
                    <th className="py-2 text-left">Product</th>
                    <th className="py-2 text-right">Units Sold</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {productPerf.map((p, i) => (
                    <tr key={p._id || i} className="hover:bg-slate-800/30">
                      <td className="py-2 text-slate-300 font-semibold">{p.name}</td>
                      <td className="py-2 text-right font-mono text-blue-400">{p.totalSold}</td>
                      <td className="py-2 text-right font-mono text-emerald-400">
                        ${(p.totalRevenue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Current Stock Levels</h3>
            <button
              id="export-stock-csv"
              onClick={handleExportStock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold text-left">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Min Level</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 rounded bg-slate-800 animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : stockReport.map((p: any, i: number) => {
                  const isLow = p.stockQuantity <= p.minStockLevel;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <tr key={p._id || i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-semibold">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.barcode}</td>
                      <td className={`px-4 py-3 font-bold font-mono ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                        {p.stockQuantity}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.minStockLevel}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOut
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : isLow
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
