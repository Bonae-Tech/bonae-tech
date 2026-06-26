import type { ContentDocument } from './schema.js';

type ParityIssue = { path: string; message: string };

function arrayLengthAt(obj: unknown, path: string[]): number | null {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return Array.isArray(current) ? current.length : null;
}

const arrayPaths: string[][] = [
  ['valueProp', 'items'],
  ['servicesSummary', 'items'],
  ['about', 'values', 'items'],
  ['about', 'members'],
  ['portfolio', 'industries', 'items'],
  ['plans', 'packages'],
  ['contact', 'form', 'serviceOptions'],
];

function memberHighlightsLength(doc: ContentDocument): number {
  return doc.about.members[0]?.highlights.length ?? 0;
}

export function checkLocaleParity(es: ContentDocument, en: ContentDocument): ParityIssue[] {
  const issues: ParityIssue[] = [];

  for (const path of arrayPaths) {
    const esLen = arrayLengthAt(es, path);
    const enLen = arrayLengthAt(en, path);
    const label = path.join('.');
    if (esLen !== enLen) {
      issues.push({
        path: label,
        message: `Array length mismatch for ${label}: es=${esLen}, en=${enLen}`,
      });
    }
  }

  const esCategories = es.services.categories;
  const enCategories = en.services.categories;
  if (esCategories.length !== enCategories.length) {
    issues.push({
      path: 'services.categories',
      message: `Array length mismatch for services.categories: es=${esCategories.length}, en=${enCategories.length}`,
    });
  }
  for (let i = 0; i < Math.min(esCategories.length, enCategories.length); i++) {
    const esItems = esCategories[i]?.items.length ?? 0;
    const enItems = enCategories[i]?.items.length ?? 0;
    if (esItems !== enItems) {
      issues.push({
        path: `services.categories[${i}].items`,
        message: `Array length mismatch: es=${esItems}, en=${enItems}`,
      });
    }
  }

  for (let i = 0; i < es.about.members.length; i++) {
    const esHighlights = es.about.members[i]?.highlights.length ?? 0;
    const enHighlights = en.about.members[i]?.highlights.length ?? 0;
    if (esHighlights !== enHighlights) {
      issues.push({
        path: `about.members[${i}].highlights`,
        message: `Highlight count mismatch: es=${esHighlights}, en=${enHighlights}`,
      });
    }
  }

  const esFirstHighlights = memberHighlightsLength(es);
  const enFirstHighlights = memberHighlightsLength(en);
  if (esFirstHighlights !== enFirstHighlights && es.about.members.length === en.about.members.length) {
    // already covered per-member above
  }

  if (es.lang !== 'es') {
    issues.push({ path: 'lang', message: 'Spanish document must have lang=es' });
  }
  if (en.lang !== 'en') {
    issues.push({ path: 'lang', message: 'English document must have lang=en' });
  }

  return issues;
}

export function assertLocaleParity(es: ContentDocument, en: ContentDocument): void {
  const issues = checkLocaleParity(es, en);
  if (issues.length > 0) {
    const detail = issues.map((i) => `- ${i.path}: ${i.message}`).join('\n');
    throw new Error(`Locale parity validation failed:\n${detail}`);
  }
}
