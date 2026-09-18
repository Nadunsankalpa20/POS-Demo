import { create } from 'zustand';

export interface LiveNotification {
  id: string;
  type: 'SALE' | 'STOCK_LOW' | 'STOCK_OUT' | 'STOCK_IN' | 'VOID';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface LiveState {
  notifications: LiveNotification[];
  unreadCount: number;
  addNotification: (type: LiveNotification['type'], title: string, message: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (type, title, message) => {
    const newNotification: LiveNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    const updated = [newNotification, ...get().notifications].slice(0, 50);
    set({
      notifications: updated,
      unreadCount: get().unreadCount + 1,
    });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
