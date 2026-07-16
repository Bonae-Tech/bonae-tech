import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createManifest, writeManifest } from '../scripts/generate-manifest.mjs';
import {
  backgroundColor,
  colors,
  cssVariables,
  terracottaGradientStops,
  themeColor,
} from '../src/styles/colors.mjs';

test('CSS variables expose the shared static brand palette', () => {
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

test('manifest generation uses browser theme colors from shared tokens', async () => {
  const manifest = createManifest();

  assert.equal(themeColor, colors['dark-blue'].DEFAULT);
  assert.equal(backgroundColor, colors.cream);
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

  const currentManifest = JSON.parse(
    await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
  );
  assert.deepEqual(currentManifest, manifest);
});

test('writeManifest emits deterministic formatted JSON', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bonae-manifest-'));
  const manifestPath = join(directory, 'manifest.webmanifest');

  try {
    const writtenPath = writeManifest(manifestPath);

    assert.equal(writtenPath, manifestPath);
    assert.equal(
      await readFile(manifestPath, 'utf8'),
      `${JSON.stringify(createManifest(), null, 2)}\n`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
