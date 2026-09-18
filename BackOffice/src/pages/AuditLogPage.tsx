import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck, RefreshCw, Search, Filter,
  User as UserIcon, Hash, Calendar, Activity,
} from 'lucide-react';

interface AuditEntry {
  _id: string;
  action: string;
  module: string;
  details: string;
  performedBy: { fullName?: string; username: string } | null;
  createdAt: string;
}

const moduleColors: Record<string, string> = {
  PRODUCT:  'bg-blue-500/10 border-blue-500/20 text-blue-400',
  STOCK:    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  SALE:     'bg-purple-500/10 border-purple-500/20 text-purple-400',
  USER:     'bg-amber-500/10 border-amber-500/20 text-amber-400',
  AUTH:     'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  CATEGORY: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  SUPPLIER: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

const actionColors: Record<string, string> = {
  CREATE:   'text-emerald-400',
  UPDATE:   'text-blue-400',
  DELETE:   'text-rose-400',
  LOGIN:    'text-cyan-400',
  LOGOUT:   'text-slate-400',
  VOID:     'text-amber-400',
  STOCK_IN: 'text-teal-400',
  STOCK_OUT:'text-orange-400',
};

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({
        module: filterModule === 'ALL' ? undefined : filterModule,
        action: filterAction === 'ALL' ? undefined : filterAction,
        limit,
      });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [filterModule, filterAction, limit]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.module.toLowerCase().includes(s) ||
      log.details.toLowerCase().includes(s) ||
      (log.performedBy?.username || '').toLowerCase().includes(s) ||
      (log.performedBy?.fullName || '').toLowerCase().includes(s)
    );
  });

  const modules = ['ALL', 'PRODUCT', 'STOCK', 'SALE', 'USER', 'AUTH', 'CATEGORY', 'SUPPLIER'];
  const actions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VOID', 'STOCK_IN', 'STOCK_OUT'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Complete log of all system actions and changes</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={250}>Last 250</option>
            <option value={500}>Last 500</option>
          </select>
          <button
            id="refresh-audit-btn"
            onClick={loadLogs}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="audit-search"
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Module:
          </span>
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filterModule === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Action:
          </span>
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setFilterAction(a)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filterAction === a
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
        <Hash className="w-3.5 h-3.5" />
        Showing {filtered.length} of {logs.length} entries
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold text-left">
                <th className="px-4 py-3">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Timestamp
                </th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                  Performed By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-slate-800 animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                        moduleColors[log.module] || 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {log.module}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold uppercase tracking-wide ${
                      actionColors[log.action] || 'text-slate-300'
                    }`}>
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-3">
                      {log.performedBy ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                            {(log.performedBy.fullName || log.performedBy.username).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-300">{log.performedBy.fullName || log.performedBy.username}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">System</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
