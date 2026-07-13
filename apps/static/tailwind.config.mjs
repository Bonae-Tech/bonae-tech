/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  safelist: [
    'from-dark-blue', 'to-dark-blue-dark',
    'from-mid-blue', 'to-dark-blue',
    'from-terracotta', 'to-terracotta-dark',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#FD7062',
          dark: '#E85A4F',
        },
        'mid-blue': '#5A7A82',
        'light-blue': '#8AA3AB',
        'dark-blue': {
          DEFAULT: '#40575D',
          dark: '#3A4E53',
        },
        pacificblue: '#2C454C',
        cream: '#F2F5F5',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
