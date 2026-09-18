import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  terminalId: string;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token'),
  terminalId: localStorage.getItem('pos_terminal_id') || 'TERM-01',

  login: (user, token) => {
    localStorage.setItem('pos_user', JSON.stringify(user));
    localStorage.setItem('pos_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
    set({ user: null, token: null });
  },
}));
