/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6edff',
          100: '#b3ccff',
          200: '#80aaff',
          300: '#4d88ff',
          400: '#1a66ff',
          500: '#1355FF',
          600: '#1047db',
          700: '#0d39b7',
          800: '#0a2c93',
          900: '#071e6f',
        },
        accent: {
          50: '#fff3ed',
          100: '#ffe0cc',
          200: '#ffc299',
          300: '#ffa366',
          400: '#ff8533',
          500: '#FF6B35',
          600: '#e65a2e',
          700: '#cc4a27',
          800: '#b33a20',
          900: '#992a19',
        }
      },
      fontFamily: {
        sans: ['Graphik', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
