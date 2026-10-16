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
        cyber: {
          900: '#070a10',
          850: '#0c111c',
          800: '#111827',
          700: '#1f293d',
          600: '#334155',
          accent: '#10b981', // Emerald security
          cyan: '#06b6d4',
          neon: '#00f59b',
          amber: '#f59e0b',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        // Systemschriften: keine Anfragen an Google Fonts o. Ä.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Roboto Mono"', 'monospace'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
