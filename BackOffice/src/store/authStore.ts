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
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('bo_user') || 'null'),
  token: localStorage.getItem('bo_token'),

  login: (user, token) => {
    localStorage.setItem('bo_user', JSON.stringify(user));
    localStorage.setItem('bo_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('bo_user');
    localStorage.removeItem('bo_token');
    set({ user: null, token: null });
  },
}));
