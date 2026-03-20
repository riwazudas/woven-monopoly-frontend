/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          100: '#fee6ca',
          200: '#fbcf9a',
          400: '#f59e42',
          600: '#d97706',
          700: '#b45309',
        },
        ink: {
          50: '#f8fafc',
          100: '#eef2f6',
          200: '#d8e1eb',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      boxShadow: {
        float: '0 24px 65px -30px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
}

