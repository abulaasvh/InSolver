/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0E7C86',
          50: '#F0FAFA',
          100: '#D5F1F3',
          200: '#ACE3E7',
          300: '#75CDD5',
          400: '#3CB0BC',
          500: '#0E7C86',
          600: '#0B6871',
          700: '#09555C',
          800: '#08454B',
          900: '#06363B',
        },
        navy: {
          DEFAULT: '#14325C',
          50: '#F2F5F9',
          100: '#E1E8F2',
          200: '#C3D2E5',
          300: '#9BB4D4',
          400: '#6E92BF',
          500: '#14325C',
          600: '#112A4E',
          700: '#0E2340',
          800: '#0B1B32',
          900: '#071221',
        },
        surface: {
          bg: '#F5F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
