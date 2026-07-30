/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        card: '#111827',
        border: '#1F2937',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#3B82F6',
        },
        text: {
          DEFAULT: '#FFFFFF',
          muted: '#9CA3AF',
        },
        success: '#22C55E',
        danger: '#EF4444',
      },
      borderRadius: {
        DEFAULT: '12px',
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
