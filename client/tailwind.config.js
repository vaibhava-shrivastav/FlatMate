/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#fafaf9',
        card: '#ffffff',
        border: '#e7e5e4',
        primary: {
          DEFAULT: '#0f766e',
          hover: '#0d9488',
        },
        text: {
          DEFAULT: '#1c1917',
          muted: '#78716c',
        },
        success: '#15803d',
        danger: '#b91c1c',
        warning: '#b45309',
      },
      borderRadius: {
        DEFAULT: '6px',
        card: '8px',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
