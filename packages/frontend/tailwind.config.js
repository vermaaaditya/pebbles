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
        pebble: {
          950: '#090a0f',
          900: '#0f111a',
          850: '#151824',
          800: '#1c2030',
          700: '#282d42',
          600: '#3a415e',
          500: '#525c84',
          400: '#7c86b0',
          300: '#a5b0d4',
          200: '#cbd4ed',
          100: '#e7ecfa',
          50: '#f4f6fd',
        },
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
