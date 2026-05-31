#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseContentDocument, parseSiteSettings } from './schema.js';
import { assertLocaleParity } from './validate.js';

const contentRoot = resolve(process.argv[2] ?? join(process.cwd(), 'apps/static/content'));
const tier = (process.argv[3] ?? 'published') as 'drafts' | 'published';

const esPath = join(contentRoot, tier, 'es.json');
const enPath = join(contentRoot, tier, 'en.json');
const settingsPath = join(contentRoot, tier, 'settings.json');

for (const p of [esPath, enPath, settingsPath]) {
  if (!existsSync(p)) {
    console.error(`Missing: ${p}`);
    process.exit(1);
  }
}

try {
  const es = parseContentDocument(JSON.parse(readFileSync(esPath, 'utf8')));
  const en = parseContentDocument(JSON.parse(readFileSync(enPath, 'utf8')));
  parseSiteSettings(JSON.parse(readFileSync(settingsPath, 'utf8')));
  assertLocaleParity(es, en);
  console.log(`Content validation passed (${tier})`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
