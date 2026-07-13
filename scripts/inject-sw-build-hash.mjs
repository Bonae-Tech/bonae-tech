#!/usr/bin/env node
/**
 * Replace __BUILD_HASH__ in dist/sw.js after a Pages site build.
 *
 * Usage (from repo root or any cwd):
 *   node scripts/inject-sw-build-hash.mjs <path-to-dist>
 *
 * Examples:
 *   node scripts/inject-sw-build-hash.mjs apps/static/dist
 *   node scripts/inject-sw-build-hash.mjs dist   # cwd = apps/<site>
 *
 * Hash source: BUILD_HASH env (e.g. github.sha) or git rev-parse --short HEAD.
 * Spec: docs/caching-pages.md
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLACEHOLDER = '__BUILD_HASH__';
const distArg = process.argv[2];

if (!distArg) {
  console.error('Usage: node scripts/inject-sw-build-hash.mjs <path-to-dist>');
  process.exit(1);
}

const distDir = resolve(process.cwd(), distArg);
const swPath = resolve(distDir, 'sw.js');

function resolveBuildHash() {
  const fromEnv = process.env.BUILD_HASH?.trim();
  if (fromEnv) {
    return fromEnv.slice(0, 7);
  }
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
    cwd: process.cwd(),
  }).trim();
}

if (!existsSync(swPath)) {
  console.error(`Missing ${swPath}. Run the site build before injecting the SW build hash.`);
  process.exit(1);
}

const source = readFileSync(swPath, 'utf8');
if (!source.includes(PLACEHOLDER)) {
  console.error(`Placeholder ${PLACEHOLDER} not found in ${swPath}.`);
  process.exit(1);
}

const buildHash = resolveBuildHash();
if (!buildHash) {
  console.error('Could not resolve a build hash (set BUILD_HASH or run inside a git repo).');
  process.exit(1);
}

writeFileSync(swPath, source.replaceAll(PLACEHOLDER, buildHash));
console.log(`Injected SW build hash ${buildHash} into ${swPath}`);
