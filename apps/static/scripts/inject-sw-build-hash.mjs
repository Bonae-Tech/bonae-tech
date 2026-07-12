import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = '__BUILD_HASH__';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'dist', 'sw.js');

function resolveBuildHash() {
  const fromEnv = process.env.BUILD_HASH?.trim();
  if (fromEnv) {
    return fromEnv.slice(0, 7);
  }
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
    cwd: root,
  }).trim();
}

if (!existsSync(swPath)) {
  console.error(`Missing ${swPath}. Run the Astro build before injecting the SW build hash.`);
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
console.log(`Injected SW cache name: bonae-tech-${buildHash}`);
