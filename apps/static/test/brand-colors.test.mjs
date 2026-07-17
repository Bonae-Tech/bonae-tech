import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  backgroundColor,
  colors,
  cssVariables,
  terracottaGradientStops,
  themeColor,
} from '../src/styles/colors.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function readText(relativePath) {
  return readFileSync(join(rootDir, relativePath), 'utf8');
}

describe('static brand color tokens', () => {
  it('keeps the committed web manifest aligned with shared PWA colors', () => {
    const manifest = JSON.parse(readText('public/manifest.webmanifest'));

    assert.equal(manifest.theme_color, themeColor);
    assert.equal(manifest.background_color, backgroundColor);
    assert.deepEqual(manifest.icons, [
      {
        src: '/favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ]);
  });

  it('exposes the same palette to Tailwind and CSS variables', () => {
    const tailwindSource = readText('tailwind.config.mjs');

    assert.match(tailwindSource, /import \{ colors, cssVariables \} from '\.\/src\/styles\/colors\.mjs';/);
    assert.match(tailwindSource, /colors,/);
    assert.match(tailwindSource, /':root': cssVariables,/);
    assert.deepEqual(cssVariables, {
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
    });
  });

  it('uses the shared theme color token for browser chrome', () => {
    const layoutSource = readText('src/layouts/Layout.astro');

    assert.match(layoutSource, /import \{ themeColor \} from '\.\.\/styles\/colors\.mjs';/);
    assert.match(layoutSource, /<meta name="theme-color" content=\{themeColor\} \/>/);
  });
});
