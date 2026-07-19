import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  backgroundColor,
  colors,
  cssVariables,
  terracottaGradientStops,
  themeColor,
} from '../src/styles/colors.mjs';
import { manifest } from '../scripts/generate-manifest.mjs';

test('generated manifest uses the shared browser chrome color tokens', async () => {
  const committedManifest = JSON.parse(
    await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')
  );

  assert.deepEqual(committedManifest, manifest);
  assert.equal(manifest.theme_color, themeColor);
  assert.equal(manifest.background_color, backgroundColor);
  assert.equal(manifest.theme_color, colors['dark-blue'].DEFAULT);
  assert.equal(manifest.background_color, colors.cream);
});

test('Tailwind and layout stay wired to the shared brand color module', async () => {
  const [tailwindConfig, layoutSource] = await Promise.all([
    readFile(new URL('../tailwind.config.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8'),
  ]);

  assert.match(
    tailwindConfig,
    /import\s+\{\s*colors,\s*cssVariables\s*\}\s+from\s+['"]\.\/src\/styles\/colors\.mjs['"]/
  );
  assert.match(layoutSource, /import\s+\{\s*themeColor\s*\}\s+from\s+['"]\.\.\/styles\/colors\.mjs['"]/);
  assert.match(layoutSource, /<meta name="theme-color" content=\{themeColor\} \/>/);

  assert.equal(cssVariables['--color-terracotta'], colors.terracotta.DEFAULT);
  assert.equal(cssVariables['--color-terracotta-light-1'], terracottaGradientStops.light1);
  assert.equal(cssVariables['--color-dark-blue'], colors['dark-blue'].DEFAULT);
  assert.equal(cssVariables['--color-cream'], colors.cream);
});
