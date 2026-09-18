import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = localStorage.getItem('bo_theme');
  const isDark = saved ? saved === 'dark' : true;

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
      localStorage.setItem('bo_theme', next ? 'dark' : 'light');
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
