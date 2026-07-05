import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseContentDocument, parseSiteSettings, type ContentDocument, type SiteSettings } from './schema.js';
import { assertLocaleParity } from './validate.js';

export interface PublishedContentBundle {
  es: ContentDocument;
  en: ContentDocument;
  settings: SiteSettings;
}

export function loadPublishedFromDir(contentRoot: string): PublishedContentBundle {
  const esPath = join(contentRoot, 'published', 'es.json');
  const enPath = join(contentRoot, 'published', 'en.json');
  const settingsPath = join(contentRoot, 'published', 'settings.json');

  for (const p of [esPath, enPath, settingsPath]) {
    if (!existsSync(p)) {
      throw new Error(`Missing content file: ${p}`);
    }
  }

  const es = parseContentDocument(JSON.parse(readFileSync(esPath, 'utf8')));
  const en = parseContentDocument(JSON.parse(readFileSync(enPath, 'utf8')));
  const settings = parseSiteSettings(JSON.parse(readFileSync(settingsPath, 'utf8')));

  assertLocaleParity(es, en);

  return { es, en, settings };
}

export function buildWhatsAppHref(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
