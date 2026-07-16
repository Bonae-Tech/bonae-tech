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
export const manifestPath = resolve(__dirname, '../public/manifest.webmanifest');

export function createManifest() {
  return {
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
}

export function writeManifest(outPath = manifestPath) {
  writeFileSync(outPath, `${JSON.stringify(createManifest(), null, 2)}\n`);
  return outPath;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const outPath = writeManifest();
  console.log(`Wrote ${outPath}`);
}
