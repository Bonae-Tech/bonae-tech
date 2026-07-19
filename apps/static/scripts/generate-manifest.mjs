#!/usr/bin/env node
/**
 * Generate public/manifest.webmanifest from shared color tokens.
 *
 * Usage (from apps/static):
 *   node scripts/generate-manifest.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { backgroundColor, themeColor } from '../src/styles/colors.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../public/manifest.webmanifest');

export const manifest = {
  name: 'BONAE TECH - Servicios Digitales',
  short_name: 'BONAE TECH',
  description: 'Servicios digitales para empresas venezolanas',
  start_url: '/',
  display: 'standalone',
  background_color: backgroundColor,
  theme_color: themeColor,
  icons: [
    {
      src: '/favicon.png',
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
};

export function writeManifest(targetPath = outPath) {
  writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return targetPath;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const writtenPath = writeManifest();
  console.log(`Wrote ${writtenPath}`);
}
