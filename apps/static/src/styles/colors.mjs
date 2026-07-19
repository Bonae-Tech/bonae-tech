/**
 * Brand palette — single source of truth for apps/static.
 * Consumed by Tailwind, CSS custom properties, Layout theme-color, and manifest generation.
 */

export const colors = {
  terracotta: {
    DEFAULT: '#FF6F61', // Coral — primary CTA / accent
    dark: '#E65A4C',
  },
  cyan: '#00CED1', // Cian Eléctrico — tech / data highlights (sparingly)
  amber: '#DAA520', // Ámbar Profundo — secondary / success
  body: '#6c7a7e', // Antracita Claro — body copy (text-body)
  'mid-blue': '#5A7A82',
  'light-blue': '#8AA3AB', // borders / secondary on dark surfaces
  'dark-blue': {
    DEFAULT: '#40575D', // Gris Petróleo — primary surfaces / headings
    dark: '#3A4E53',
  },
  pacificblue: '#2C454C',
  cream: '#FBFDFF', // Blanco Hielo — page background
};

/** Lighter coral stops for Plans CTA gradients (derived from terracotta) */
export const terracottaGradientStops = {
  light1: '#FF8478',
  light2: '#FF9186',
  light3: '#FF9C92',
};

/** Browser chrome / PWA theme */
export const themeColor = colors['dark-blue'].DEFAULT;

/** Page / PWA background surface */
export const backgroundColor = colors.cream;

/**
 * Flat CSS custom properties for `:root` injection (Tailwind `addBase` plugin).
 * @type {Record<string, string>}
 */
export const cssVariables = {
  '--color-terracotta': colors.terracotta.DEFAULT,
  '--color-terracotta-dark': colors.terracotta.dark,
  '--color-terracotta-light-1': terracottaGradientStops.light1,
  '--color-terracotta-light-2': terracottaGradientStops.light2,
  '--color-terracotta-light-3': terracottaGradientStops.light3,
  '--color-cyan': colors.cyan,
  '--color-amber': colors.amber,
  '--color-body': colors.body,
  '--color-mid-blue': colors['mid-blue'],
  '--color-light-blue': colors['light-blue'],
  '--color-dark-blue': colors['dark-blue'].DEFAULT,
  '--color-dark-blue-dark': colors['dark-blue'].dark,
  '--color-pacificblue': colors.pacificblue,
  '--color-cream': colors.cream,
};
