import React from 'react';
import { useLiveStore } from '../store/liveStore';
import { Bell, Check, Trash2, AlertTriangle, AlertCircle, ShoppingCart, RefreshCw, X } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useLiveStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'STOCK_OUT':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'STOCK_LOW':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'SALE':
        return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-500" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Real-Time Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                title="Mark all read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={clearNotifications}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No new activity. Real-time updates will show here.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-2.5 rounded-xl border transition-all text-xs flex gap-2.5 ${
                n.read
                  ? 'bg-transparent border-transparent text-slate-400'
                  : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/40 text-slate-800 dark:text-slate-200 font-medium'
              }`}
            >
              <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-[11px] mt-0.5 leading-snug">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
