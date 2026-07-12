import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  injectServiceWorkerBuildHash,
  resolveBuildHash,
} from './inject-sw-build-hash.mjs';

function createTempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), 'bonae-static-sw-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'dist'));
  return root;
}

test('injects a shortened BUILD_HASH into every service worker placeholder', (t) => {
  const root = createTempRoot(t);
  const swPath = join(root, 'dist', 'sw.js');
  writeFileSync(
    swPath,
    "const CACHE_NAME = 'bonae-tech-__BUILD_HASH__';\n// cache: __BUILD_HASH__\n",
  );

  const result = injectServiceWorkerBuildHash({
    root,
    env: { BUILD_HASH: '  123456789abcdef  ' },
    execFileSync: () => {
      throw new Error('git should not be called when BUILD_HASH is set');
    },
  });

  assert.equal(result.buildHash, '1234567');
  assert.equal(result.cacheName, 'bonae-tech-1234567');
  assert.equal(
    readFileSync(swPath, 'utf8'),
    "const CACHE_NAME = 'bonae-tech-1234567';\n// cache: 1234567\n",
  );
});

test('falls back to git short hash when BUILD_HASH is not provided', () => {
  const hash = resolveBuildHash({
    env: {},
    cwd: '/repo/apps/static',
    execFileSync(command, args, options) {
      assert.equal(command, 'git');
      assert.deepEqual(args, ['rev-parse', '--short', 'HEAD']);
      assert.equal(options.cwd, '/repo/apps/static');
      assert.equal(options.encoding, 'utf8');
      return 'abcdef0\n';
    },
  });

  assert.equal(hash, 'abcdef0');
});

test('fails before writing when the service worker placeholder is missing', (t) => {
  const root = createTempRoot(t);
  const swPath = join(root, 'dist', 'sw.js');
  const originalSource = "const CACHE_NAME = 'bonae-tech-old';\n";
  writeFileSync(swPath, originalSource);

  assert.throws(
    () =>
      injectServiceWorkerBuildHash({
        root,
        env: { BUILD_HASH: '7654321' },
      }),
    /Placeholder __BUILD_HASH__ not found/,
  );
  assert.equal(readFileSync(swPath, 'utf8'), originalSource);
});
