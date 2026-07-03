/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  safelist: [
    'from-brand-dark', 'to-brand-dark-dark',
    'from-brand-accent', 'to-brand-accent-dark',
  ],
  theme: {
    extend: {
      colors: {
        'brand-accent': {
          DEFAULT: '#C0392B',
          dark: '#a93226',
        },
        'brand-dark': {
          DEFAULT: '#5C3317',
          dark: '#4a2912',
        },
        'brand-cream': '#F5F0E8',
        'brand-muted': '#8B7355',
        'brand-light': '#D4C4B0',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
