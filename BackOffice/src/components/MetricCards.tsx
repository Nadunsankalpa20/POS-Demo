import React from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Package,
  AlertTriangle,
  XCircle,
  CircleDollarSign,
  ArrowUpRight,
} from 'lucide-react';

interface MetricCardsProps {
  metrics: {
    todayRevenue: number;
    todayTransactions: number;
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockCostValue: number;
    totalStockRetailValue: number;
  };
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const cards = [
    {
      label: "Today's Revenue",
      value: `Rs. ${(metrics?.todayRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${metrics?.todayTransactions || 0} completed orders`,
      icon: TrendingUp,
      gradient: 'from-blue-600/10 to-indigo-600/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
      badge: 'Live',
    },
    {
      label: 'Inventory Cost Value',
      value: `Rs. ${(metrics?.totalStockCostValue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: `Retail: Rs. ${(metrics?.totalStockRetailValue || 0).toLocaleString()}`,
      icon: CircleDollarSign,
      gradient: 'from-emerald-600/10 to-teal-600/10',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-500',
      badge: 'Valuation',
    },
    {
      label: 'Active Products',
      value: (metrics?.totalProducts || 0).toString(),
      sub: 'Catalog SKU items',
      icon: Package,
      gradient: 'from-purple-600/10 to-pink-600/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-500',
      badge: 'Catalog',
    },
    {
      label: 'Low Stock Alert',
      value: (metrics?.lowStockCount || 0).toString(),
      sub: 'Items ≤ minimum threshold',
      icon: AlertTriangle,
      gradient: 'from-amber-600/10 to-yellow-600/10',
      borderColor: 'border-amber-500/20',
      iconColor: 'text-amber-500',
      badge: 'Needs Reorder',
    },
    {
      label: 'Out of Stock',
      value: (metrics?.outOfStockCount || 0).toString(),
      sub: '0 units remaining in store',
      icon: XCircle,
      gradient: 'from-rose-600/10 to-red-600/10',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-500',
      badge: 'Immediate Action',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-white dark:bg-[#1e293b] border ${card.borderColor} bg-gradient-to-br ${card.gradient} card-3d shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono tracking-tight">
                  {card.value}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 truncate">{card.sub}</span>
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                {card.badge} <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
