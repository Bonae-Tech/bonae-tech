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
  ['about', 'members'],
  ['templates', 'items'],
  ['contact', 'form', 'serviceOptions'],
];

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

  for (let i = 0; i < es.templates.items.length; i++) {
    const esFeatures = es.templates.items[i]?.features.length ?? 0;
    const enFeatures = en.templates.items[i]?.features.length ?? 0;
    if (esFeatures !== enFeatures) {
      issues.push({
        path: `templates.items[${i}].features`,
        message: `Feature count mismatch: es=${esFeatures}, en=${enFeatures}`,
      });
    }
    const esSlug = es.templates.items[i]?.slug ?? '';
    const enSlug = en.templates.items[i]?.slug ?? '';
    if (esSlug !== enSlug) {
      issues.push({
        path: `templates.items[${i}].slug`,
        message: `Slug mismatch: es=${esSlug}, en=${enSlug}`,
      });
    }
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
