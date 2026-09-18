import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useHeldBillsStore } from '../store/heldBillsStore';
import { useShiftStore } from '../store/shiftStore';
import {
  ShoppingBag,
  Clock,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  LogOut,
  History,
  BookmarkCheck,
  UserCheck,
  Store,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenHeldBills: () => void;
  onOpenMenu?: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenHeldBills,
  onOpenMenu,
  isOnline,
}) => {
  const { user, logout, terminalId } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { heldBills } = useHeldBillsStore();
  const shiftStore = useShiftStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 px-5 ios-glass-panel flex items-center justify-between z-30 transition-colors border-b border-white/10">
      {/* Brand & Terminal Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 card-3d border border-emerald-300/40">
            <Store className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-green-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                SUPER POS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>3D RETAIL LIVE</span>
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{terminalId}</span>
              <span>•</span>
              <span className="text-emerald-500 font-semibold">
                {shiftStore.isShiftActive ? shiftStore.lockerId : 'Lane 01'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Live Clock & Network Status */}
      <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-2xl ios-glass-pill border border-emerald-500/30">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800 dark:text-gray-200">
          <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span>{time}</span>
        </div>
        <div className="h-3 w-px bg-slate-300 dark:bg-white/20" />
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isOnline ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wide flex items-center gap-1">
                <span>ONLINE CLOUD SYNC</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">OFFLINE CACHE</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Terminal Menu button (Returns to 5-tab menu) */}
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Return to Main Menu (5 Tabs)"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Terminal Menu</span>
          </button>
        )}

        {/* Held Bills button with badge */}
        <button
          onClick={onOpenHeldBills}
          className="relative px-3.5 py-2 rounded-xl ios-glass-pill hover:bg-white/40 dark:hover:bg-white/15 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="Resume held transactions"
        >
          <BookmarkCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="hidden sm:inline">Held Bills</span>
          {heldBills.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center animate-bounce">
              {heldBills.length}
            </span>
          )}
        </button>

        {/* Sales History button */}
        <button
          onClick={onOpenHistory}
          className="px-3.5 py-2 rounded-xl ios-glass-pill hover:bg-white/40 dark:hover:bg-white/15 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="Recent sales"
        >
          <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl ios-glass-pill hover:bg-white/40 dark:hover:bg-white/15 text-slate-700 dark:text-gray-200 transition-all active:scale-95 cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Cashier profile & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-300 dark:border-white/10">
          <div className="hidden lg:block text-right">
            <div className="text-xs font-bold text-slate-900 dark:text-gray-100">{user?.fullName || 'Cashier'}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:text-rose-500 dark:hover:text-rose-200 transition-all active:scale-95 cursor-pointer"
            title="Log Out Cashier"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
