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
        darkBg: '#090d16',
        darkCard: '#111827',
        darkCardHover: '#1f2937',
        darkBorder: '#1f2937',
        primaryRed: '#ef4444',
        accentBlue: '#3b82f6',
        accentOrange: '#f97316',
        accentGreen: '#22c55e',
        accentYellow: '#eab308'
      }
    },
  },
  plugins: [],
}
