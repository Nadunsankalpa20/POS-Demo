import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getBackOfficeSocket } from '../services/socket';
import { MetricCards } from '../components/MetricCards';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RefreshCw, TrendingUp, ShoppingCart, Activity, ArrowUpRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#ef4444'];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Listen to real-time sync events from POS and Stock mutations
    const socket = getBackOfficeSocket();

    const handleRealtimeUpdate = () => {
      console.log('[Dashboard] Real-time event received, refreshing metrics...');
      loadDashboard();
    };

    socket.on('STOCK_UPDATED', handleRealtimeUpdate);
    socket.on('SALE_COMPLETED', handleRealtimeUpdate);
    socket.on('SALE_VOIDED', handleRealtimeUpdate);

    return () => {
      socket.off('STOCK_UPDATED', handleRealtimeUpdate);
      socket.off('SALE_COMPLETED', handleRealtimeUpdate);
      socket.off('SALE_VOIDED', handleRealtimeUpdate);
    };
  }, [loadDashboard]);

  if (isLoading && !data) {
    return (
      <div className="p-8 flex items-center justify-center text-xs text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
        <span>Loading live Back Office Dashboard...</span>
      </div>
    );
  }

  // Formatting chart data
  const trendData = (data?.salesTrend || []).map((t: any) => ({
    date: t._id,
    revenue: t.revenue,
    orders: t.transactions,
  }));

  const topProductsData = (data?.topProducts || []).map((p: any) => ({
    name: p.productName.length > 14 ? `${p.productName.slice(0, 14)}...` : p.productName,
    qty: p.totalQuantity,
    revenue: p.totalRevenue,
  }));

  const categoryData = (data?.categoryDistribution || []).map((c: any) => ({
    name: c.name,
    value: c.count,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Real-Time Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized with POS terminals and warehouse movements
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <MetricCards metrics={data} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revenue Trend (Last 7 Days)
              </h3>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                Rs. {(data?.todayRevenue || 0).toLocaleString()} Today
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
              Sales Volume
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.length > 0 ? trendData : [{ date: 'Today', revenue: data?.todayRevenue || 0 }]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Catalog by Category
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 mt-2">
            {categoryData.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{c.name} ({c.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products & Live Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products Bar Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Top Performing Items (Quantity Sold)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Sales Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent POS Sales
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {(data?.recentSales || []).slice(0, 5).map((sale: any) => (
                <div
                  key={sale._id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sale.invoiceNumber}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {sale.cashierName} • {sale.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-500 font-mono">
                      Rs. {sale.total.toFixed(2)}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {sale.items?.length || 0} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Stock Movement Ledger Ticker */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent Stock Movements
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">AUDIT</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {(data?.recentMovements || []).slice(0, 5).map((m: any) => (
                <div
                  key={m._id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[140px]">
                      {m.productName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {m.type} • {m.userName || 'System'}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className={`font-bold ${
                        m.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Now: {m.newStock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
