/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terracotta: '#FF6B35',
        'dark-blue': '#44808F',
        pacificblue: '#3996AE',
      },
    },
  },
  plugins: [],
};
