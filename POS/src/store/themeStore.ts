import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = localStorage.getItem('pos_theme');
  const isDark = saved ? saved === 'dark' : true; // default dark mode for futuristic 3D aesthetic

  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isDarkMode: isDark,
    toggleTheme: () => {
      const next = !get().isDarkMode;
      localStorage.setItem('pos_theme', next ? 'dark' : 'light');
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set({ isDarkMode: next });
    },
  };
});
