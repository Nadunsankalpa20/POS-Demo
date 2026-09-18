import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  UserPlus, RefreshCw, Edit2, Shield, User as UserIcon,
  CheckCircle, XCircle, Search, Eye, EyeOff,
} from 'lucide-react';

interface UserRecord {
  _id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  ADMIN:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  MANAGER: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  CASHIER: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: UserRecord | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, editUser }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');
  const [isActive, setIsActive] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editUser) {
        setUsername(editUser.username);
        setFullName(editUser.fullName);
        setRole(editUser.role);
        setIsActive(editUser.isActive);
        setPassword('');
      } else {
        setUsername(''); setFullName(''); setPassword(''); setRole('CASHIER'); setIsActive(true);
      }
      setError(null);
    }
  }, [isOpen, editUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!editUser && !password) { setError('Password is required for new users'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = { fullName, role, isActive };
      if (!editUser) { payload.username = username; payload.password = password; }
      else if (password) { payload.password = password; }

      if (editUser) {
        await api.updateUser(editUser._id, payload);
      } else {
        await api.createUser({ ...payload, username });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-400" />
            {editUser ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name *</label>
            <input
              id="user-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {!editUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username *</label>
              <input
                id="user-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="john.smith"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Password {editUser ? '(leave blank to keep current)' : '*'}
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editUser ? '••••••••' : 'Min 6 characters'}
                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Role *</label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {editUser && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-400">Active</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-semibold ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              id="save-user-btn"
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Saving…' : editUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuccess = () => {
    setModalOpen(false);
    setEditUser(null);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage system users, roles and access permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="create-user-btn"
            onClick={() => { setEditUser(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/25"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
          <button
            onClick={loadUsers}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="user-search"
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold text-left">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-slate-800 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">No users found</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-200 font-semibold">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">@{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${roleColors[u.role]}`}>
                        <Shield className="w-2.5 h-2.5" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700/50 border-slate-600/50 text-slate-500'
                      }`}>
                        {u.isActive ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditUser(u); setModalOpen(true); }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(null); }}
        onSuccess={handleSuccess}
        editUser={editUser}
      />
    </div>
  );
};
