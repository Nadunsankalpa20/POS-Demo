import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLiveStore } from '../store/liveStore';
import { NotificationPopover } from './NotificationPopover';
import type { User } from '../store/authStore';
import type { PageKey } from '../App';
import { Bell, Radio } from 'lucide-react';

const pageTitles: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  products:  'Products Catalog',
  stock:     'Stock Operations',
  reports:   'Reports & Analytics',
  users:     'User Management',
  audit:     'Audit Trail',
};

interface HeaderProps {
  activePage: PageKey;
  user: User;
}

export const Header: React.FC<HeaderProps> = ({ activePage, user }) => {
  const { unreadCount } = useLiveStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="h-16 px-6 border-b border-slate-800/70 bg-[#0d1424]/90 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-extrabold text-slate-100 tracking-tight">
          {pageTitles[activePage]}
        </h1>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          <span>LIVE SYNC</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 relative transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black">
            {(user.fullName || user.username).charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user.fullName || user.username}</div>
            <div className="text-[10px] font-semibold text-blue-400">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
