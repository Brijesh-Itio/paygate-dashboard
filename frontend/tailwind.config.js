/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563EB',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a5f',
        },
        success: { 500: '#10b981', 100: '#d1fae5' },
        danger: { 500: '#ef4444', 100: '#fee2e2' },
        warning: { 500: '#f59e0b', 100: '#fef3c7' },
        surface: '#0f172a',
        card: '#1e293b',
        border: '#334155',
      }
    }
  },
  plugins: []
};
