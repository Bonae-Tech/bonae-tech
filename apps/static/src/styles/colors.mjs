/**
 * Brand palette — single source of truth for apps/static.
 * Consumed by Tailwind, CSS custom properties, Layout theme-color, and manifest generation.
 */

export const colors = {
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
};

/** Lighter coral stops for Plans CTA gradients (derived from terracotta) */
export const terracottaGradientStops = {
  light1: '#FE8579',
  light2: '#FE9186',
  light3: '#FE9C92',
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
  '--color-mid-blue': colors['mid-blue'],
  '--color-light-blue': colors['light-blue'],
  '--color-dark-blue': colors['dark-blue'].DEFAULT,
  '--color-dark-blue-dark': colors['dark-blue'].dark,
  '--color-pacificblue': colors.pacificblue,
  '--color-cream': colors.cream,
};
