import { execFileSync as defaultExecFileSync } from 'node:child_process';
import {
  existsSync as defaultExistsSync,
  readFileSync as defaultReadFileSync,
  writeFileSync as defaultWriteFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = '__BUILD_HASH__';
const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveBuildHash({
  env = process.env,
  execFileSync = defaultExecFileSync,
  cwd = DEFAULT_ROOT,
} = {}) {
  const fromEnv = env.BUILD_HASH?.trim();
  if (fromEnv) {
    return fromEnv.slice(0, 7);
  }
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
    cwd,
  }).trim();
}

export function injectServiceWorkerBuildHash({
  root = DEFAULT_ROOT,
  env = process.env,
  execFileSync = defaultExecFileSync,
  existsSync = defaultExistsSync,
  readFileSync = defaultReadFileSync,
  writeFileSync = defaultWriteFileSync,
} = {}) {
  const swPath = join(root, 'dist', 'sw.js');

  if (!existsSync(swPath)) {
    throw new Error(`Missing ${swPath}. Run the Astro build before injecting the SW build hash.`);
  }

  const source = readFileSync(swPath, 'utf8');
  if (!source.includes(PLACEHOLDER)) {
    throw new Error(`Placeholder ${PLACEHOLDER} not found in ${swPath}.`);
  }

  const buildHash = resolveBuildHash({ env, execFileSync, cwd: root });
  if (!buildHash) {
    throw new Error('Could not resolve a build hash (set BUILD_HASH or run inside a git repo).');
  }

  const cacheName = `bonae-tech-${buildHash}`;
  writeFileSync(swPath, source.replaceAll(PLACEHOLDER, buildHash));

  return { buildHash, cacheName, swPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { cacheName } = injectServiceWorkerBuildHash();
    console.log(`Injected SW cache name: ${cacheName}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
