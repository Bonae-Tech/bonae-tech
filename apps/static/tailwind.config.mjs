import plugin from 'tailwindcss/plugin';
import { colors, cssVariables } from './src/styles/colors.mjs';

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
      colors,
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        ':root': cssVariables,
      });
    }),
  ],
};
