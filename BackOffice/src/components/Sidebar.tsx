import React from 'react';
import { useAuthStore } from '../store/authStore';
import type { User } from '../store/authStore';
import type { PageKey } from '../App';
import {
  LayoutDashboard,
  Package,
  Boxes,
  BarChart3,
  Users,
  ShieldCheck,
  Store,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  user: User;
}

const navItems: Array<{ id: PageKey; label: string; icon: any; adminOnly?: boolean }> = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'products',  label: 'Products Catalog',   icon: Package },
  { id: 'stock',     label: 'Stock Operations',   icon: Boxes },
  { id: 'reports',   label: 'Reports & Analytics',icon: BarChart3 },
  { id: 'users',     label: 'User Management',    icon: Users,        adminOnly: true },
  { id: 'audit',     label: 'Audit Trail',        icon: ShieldCheck,  adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, user }) => {
  const { logout } = useAuthStore();
  const isAdmin = user.role === 'ADMIN';

  return (
    <aside className="w-64 h-screen bg-[#0a0f1e] text-slate-200 border-r border-slate-800/70 flex flex-col justify-between shrink-0 select-none">
      {/* Brand */}
      <div>
        <div className="h-16 px-5 border-b border-slate-800/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              SUPERMART
            </span>
            <span className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              Back Office
            </span>
          </div>
        </div>

        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/70">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user.fullName || user.username}</div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-0.5">{user.role}</div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
