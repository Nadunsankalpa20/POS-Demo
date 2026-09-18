/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          accent: '#10b981',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
        },
        dark: {
          bg: '#0b0f19',
          surface: '#111827',
          card: '#1a2234',
          cardHover: '#232d42',
          border: '#243048',
          text: '#f3f4f6',
          muted: '#9ca3af'
        }
      },
      boxShadow: {
        '3d-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        '3d': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        '3d-lg': '0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.35)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}
