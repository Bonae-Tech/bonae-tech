import { checkLocaleParity } from '@bonae/content/validate';
import {
  parseContentDocument,
  parseSiteSettings,
  type ContentDocument,
  type SiteSettings,
} from '@bonae/content/schema';

export type ReviewGroupId = 'es' | 'en' | 'settings';

export interface ReviewGroupResult {
  id: ReviewGroupId;
  label: string;
  hasChanges: boolean;
  changes: string[];
  validationErrors: string[];
  missingTranslationIssues: string[];
}

const LOCALE_SECTIONS: (keyof ContentDocument)[] = [
  'hero',
  'valueProp',
  'about',
  'contact',
  'plans',
  'footer',
  'nav',
  'siteName',
  'siteTagline',
  'metaDescription',
];

function localeSectionChanges(
  draft: ContentDocument,
  published: ContentDocument,
): string[] {
  const changes: string[] = [];
  for (const key of LOCALE_SECTIONS) {
    if (JSON.stringify(draft[key]) !== JSON.stringify(published[key])) {
      changes.push(`Changed: ${key}`);
    }
  }
  return changes;
}

function settingsChanges(draft: SiteSettings, published: SiteSettings): string[] {
  if (JSON.stringify(draft) === JSON.stringify(published)) {
    return [];
  }
  return ['Site settings differ from published'];
}

function validationErrorsForLocale(draft: unknown, label: string): string[] {
  try {
    parseContentDocument(draft);
    return [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid document';
    return [`${label}: ${message}`];
  }
}

function validationErrorsForSettings(draft: unknown): string[] {
  try {
    parseSiteSettings(draft);
    return [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid settings';
    return [`Settings: ${message}`];
  }
}

export function buildPublishReview(input: {
  draft: { es: unknown; en: unknown; settings: unknown };
  published: { es: unknown; en: unknown; settings: unknown };
}): ReviewGroupResult[] {
  const esDraft = input.draft.es as ContentDocument;
  const enDraft = input.draft.en as ContentDocument;
  const esPublished = input.published.es as ContentDocument;
  const enPublished = input.published.en as ContentDocument;
  const settingsDraft = input.draft.settings as SiteSettings;
  const settingsPublished = input.published.settings as SiteSettings;

  let parityIssues: string[] = [];
  try {
    const es = parseContentDocument(input.draft.es);
    const en = parseContentDocument(input.draft.en);
    parityIssues = checkLocaleParity(es, en).map((i) => `${i.path}: ${i.message}`);
  } catch {
    // Locale parse errors surface in per-locale validation groups.
  }

  const esChanges = localeSectionChanges(esDraft, esPublished);
  const enChanges = localeSectionChanges(enDraft, enPublished);
  const settingsChangeList = settingsChanges(settingsDraft, settingsPublished);

  return [
    {
      id: 'es',
      label: 'Spanish (ES)',
      hasChanges: esChanges.length > 0,
      changes: esChanges,
      validationErrors: validationErrorsForLocale(input.draft.es, 'ES'),
      missingTranslationIssues: parityIssues,
    },
    {
      id: 'en',
      label: 'English (EN)',
      hasChanges: enChanges.length > 0,
      changes: enChanges,
      validationErrors: validationErrorsForLocale(input.draft.en, 'EN'),
      missingTranslationIssues: parityIssues,
    },
    {
      id: 'settings',
      label: 'Site settings',
      hasChanges: settingsChangeList.length > 0,
      changes: settingsChangeList,
      validationErrors: validationErrorsForSettings(input.draft.settings),
      missingTranslationIssues: [],
    },
  ];
}

export function reviewBlocksPublish(groups: ReviewGroupResult[]): boolean {
  return groups.some(
    (g) => g.validationErrors.length > 0 || g.missingTranslationIssues.length > 0,
  );
}

export function reviewHasNoChanges(groups: ReviewGroupResult[]): boolean {
  return groups.every((g) => !g.hasChanges);
}
