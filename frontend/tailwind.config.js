/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          card: '#161b27',
          border: '#1e2535',
          hover: '#1a2030',
        },
        gain: {
          DEFAULT: '#22c55e',
          dim: '#16a34a',
          bg: 'rgba(34,197,94,0.1)',
        },
        loss: {
          DEFAULT: '#ef4444',
          dim: '#dc2626',
          bg: 'rgba(239,68,68,0.1)',
        },
        opportunity: {
          DEFAULT: '#f59e0b',
          dim: '#d97706',
          bg: 'rgba(245,158,11,0.1)',
        },
        brand: '#6366f1',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
