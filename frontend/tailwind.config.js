/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light enterprise palette
        pageBg: '#f3f5f8',
        surface: '#ffffff',
        lineDefault: '#e3e8ee',
        lineStrong: '#cbd5e1',
        inkPrimary: '#1a2332',
        inkSecondary: '#5b6b7f',
        inkMuted: '#8896a6',
        railBlue: '#1a56a0',
        railBlueDark: '#144270',
        railBlueSoft: '#eaf1fa',
        okGreen: '#188554',
        okGreenSoft: '#e5f5ec',
        warnAmber: '#a05e03',
        warnAmberSoft: '#fdf3df',
        critRed: '#c02626',
        critRedSoft: '#fbe9e9',
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
