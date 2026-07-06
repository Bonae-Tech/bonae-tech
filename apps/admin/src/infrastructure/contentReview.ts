import { checkLocaleParity } from '@bonae/content/validate';
import {
  parseContentDocument,
  parseSiteSettings,
  type ContentDocument,
  type SiteSettings,
} from '@bonae/content/schema';

export type ReviewChangeKind = 'changed' | 'added' | 'removed';

export interface ReviewFieldChange {
  locale: 'es' | 'en' | 'settings';
  label: string;
  kind: ReviewChangeKind;
  before?: string;
  after?: string;
}

export interface ReviewWarning {
  label: string;
  message: string;
}

export interface PublishReview {
  changes: ReviewFieldChange[];
  warnings: ReviewWarning[];
  validationErrors: string[];
  changeCount: number;
}

const SECTION_TITLES: Record<string, string> = {
  nav: 'Navigation',
  hero: 'Hero',
  valueProp: 'Services',
  keyFigures: 'Key figures',
  about: 'About',
  plans: 'Plans',
  contact: 'Contact',
  footer: 'Footer',
  cookieBanner: 'Cookie banner',
};

const HERO_FIELDS: Record<string, string> = {
  badge: 'Badge',
  headline: 'Headline',
  subheadline: 'Subtitle',
  cta: 'Primary CTA',
  ctaSecondary: 'Secondary CTA',
  ctaSub: 'Reassurance note',
};

const VALUE_PROP_FIELDS: Record<string, string> = {
  sectionBadge: 'Section badge',
  title: 'Title',
  subheadline: 'Subheadline',
};

const VALUE_PROP_ITEM_FIELDS: Record<string, string> = {
  icon: 'Icon',
  title: 'Title',
  description: 'Description',
  backLabel: 'Back label',
  backDescription: 'Back description',
};

const TOP_LEVEL_STRING_FIELDS: Record<string, string> = {
  siteName: 'Site name',
  siteTagline: 'Site tagline',
  metaDescription: 'Meta description',
};

function truncate(value: string, max = 140): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function humanizeSegment(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z])/g, ' $1');
}

function formatChangeLabel(locale: ReviewFieldChange['locale'], ...segments: string[]): string {
  const prefix = locale === 'settings' ? 'Settings' : locale.toUpperCase();
  return [prefix, ...segments].join(' › ');
}

function pushStringChange(
  changes: ReviewFieldChange[],
  locale: ReviewFieldChange['locale'],
  label: string,
  before: string,
  after: string,
): void {
  if (before === after) {
    return;
  }
  changes.push({
    locale,
    label,
    kind: 'changed',
    before: truncate(before),
    after: truncate(after),
  });
}

function diffRecordStrings(
  changes: ReviewFieldChange[],
  locale: ReviewFieldChange['locale'],
  sectionTitle: string,
  fieldLabels: Record<string, string>,
  draft: Record<string, unknown>,
  published: Record<string, unknown>,
): void {
  for (const [field, fieldLabel] of Object.entries(fieldLabels)) {
    const before = published[field];
    const after = draft[field];
    if (typeof before !== 'string' || typeof after !== 'string') {
      continue;
    }
    pushStringChange(changes, locale, formatChangeLabel(locale, sectionTitle, fieldLabel), before, after);
  }
}

function diffValuePropItems(
  changes: ReviewFieldChange[],
  locale: 'es' | 'en',
  draft: ContentDocument,
  published: ContentDocument,
): void {
  const draftItems = draft.valueProp.items;
  const publishedItems = published.valueProp.items;

  for (let i = 0; i < draftItems.length; i++) {
    const draftItem = draftItems[i];
    const publishedItem = publishedItems[i];

    if (!publishedItem) {
      for (const [field, fieldLabel] of Object.entries(VALUE_PROP_ITEM_FIELDS)) {
        const value = draftItem[field as keyof typeof draftItem];
        if (typeof value !== 'string') {
          continue;
        }
        changes.push({
          locale,
          label: formatChangeLabel(locale, 'Services', `Item ${i + 1}`, fieldLabel),
          kind: 'added',
          after: truncate(value),
        });
      }
      continue;
    }

    for (const [field, fieldLabel] of Object.entries(VALUE_PROP_ITEM_FIELDS)) {
      const before = publishedItem[field as keyof typeof publishedItem];
      const after = draftItem[field as keyof typeof draftItem];
      if (typeof before !== 'string' || typeof after !== 'string') {
        continue;
      }
      pushStringChange(
        changes,
        locale,
        formatChangeLabel(locale, 'Services', `Item ${i + 1}`, fieldLabel),
        before,
        after,
      );
    }
  }

  for (let i = draftItems.length; i < publishedItems.length; i++) {
    const publishedItem = publishedItems[i];
    const labelParts = Object.entries(VALUE_PROP_ITEM_FIELDS)
      .map(([field, fieldLabel]) => {
        const value = publishedItem[field as keyof typeof publishedItem];
        return typeof value === 'string' ? `${fieldLabel}: ${truncate(value, 60)}` : null;
      })
      .filter(Boolean);
    changes.push({
      locale,
      label: formatChangeLabel(locale, 'Services', `Item ${i + 1}`),
      kind: 'removed',
      before: labelParts.join(' · ') || 'Removed item',
    });
  }
}

function diffLocaleDocument(
  locale: 'es' | 'en',
  draft: ContentDocument,
  published: ContentDocument,
): ReviewFieldChange[] {
  const changes: ReviewFieldChange[] = [];

  diffRecordStrings(changes, locale, 'Document', TOP_LEVEL_STRING_FIELDS, draft, published);

  for (const [sectionKey, sectionTitle] of Object.entries(SECTION_TITLES)) {
    const draftSection = draft[sectionKey as keyof ContentDocument];
    const publishedSection = published[sectionKey as keyof ContentDocument];
    if (
      typeof draftSection !== 'object' ||
      draftSection === null ||
      typeof publishedSection !== 'object' ||
      publishedSection === null
    ) {
      continue;
    }

    if (sectionKey === 'hero') {
      diffRecordStrings(
        changes,
        locale,
        sectionTitle,
        HERO_FIELDS,
        draftSection as Record<string, unknown>,
        publishedSection as Record<string, unknown>,
      );
      continue;
    }

    if (sectionKey === 'valueProp') {
      diffRecordStrings(
        changes,
        locale,
        sectionTitle,
        VALUE_PROP_FIELDS,
        draftSection as Record<string, unknown>,
        publishedSection as Record<string, unknown>,
      );
      diffValuePropItems(changes, locale, draft, published);
      continue;
    }

    if (JSON.stringify(draftSection) !== JSON.stringify(publishedSection)) {
      changes.push({
        locale,
        label: formatChangeLabel(locale, sectionTitle),
        kind: 'changed',
        before: truncate(JSON.stringify(publishedSection)),
        after: truncate(JSON.stringify(draftSection)),
      });
    }
  }

  return changes;
}

function diffSettings(draft: SiteSettings, published: SiteSettings): ReviewFieldChange[] {
  const changes: ReviewFieldChange[] = [];
  if (JSON.stringify(draft) === JSON.stringify(published)) {
    return changes;
  }

  const walk = (path: string, d: unknown, p: unknown): void => {
    if (typeof d === 'string' && typeof p === 'string') {
      const segments = path.split(' · ').map(humanizeSegment);
      pushStringChange(changes, 'settings', formatChangeLabel('settings', ...segments), p, d);
      return;
    }
    if (Array.isArray(d) && Array.isArray(p)) {
      if (JSON.stringify(d) !== JSON.stringify(p)) {
        const segments = path.split(' · ').map(humanizeSegment);
        changes.push({
          locale: 'settings',
          label: formatChangeLabel('settings', ...segments),
          kind: 'changed',
          before: truncate(JSON.stringify(p)),
          after: truncate(JSON.stringify(d)),
        });
      }
      return;
    }
    if (typeof d === 'object' && d !== null && typeof p === 'object' && p !== null) {
      for (const key of new Set([...Object.keys(d as object), ...Object.keys(p as object)])) {
        walk(path ? `${path} · ${key}` : key, (d as Record<string, unknown>)[key], (p as Record<string, unknown>)[key]);
      }
    }
  };

  walk('', draft, published);
  return changes;
}

function missingEnTranslationWarnings(
  enDraft: ContentDocument,
  enPublished: ContentDocument,
  esChanges: ReviewFieldChange[],
): ReviewWarning[] {
  const warnings: ReviewWarning[] = [];

  for (const change of esChanges) {
    if (change.locale !== 'es' || change.kind !== 'changed') {
      continue;
    }

    const heroMatch = change.label.match(/^ES › Hero › (.+)$/);
    if (heroMatch) {
      const fieldLabel = heroMatch[1];
      const fieldKey = Object.entries(HERO_FIELDS).find(([, label]) => label === fieldLabel)?.[0];
      if (fieldKey) {
        const enBefore = enPublished.hero[fieldKey as keyof typeof enPublished.hero];
        const enAfter = enDraft.hero[fieldKey as keyof typeof enDraft.hero];
        if (typeof enBefore === 'string' && typeof enAfter === 'string' && enBefore === enAfter) {
          warnings.push({ label: change.label, message: 'Missing EN translation' });
        }
      }
    }
  }

  return warnings;
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
}): PublishReview {
  const esDraft = input.draft.es as ContentDocument;
  const enDraft = input.draft.en as ContentDocument;
  const esPublished = input.published.es as ContentDocument;
  const enPublished = input.published.en as ContentDocument;
  const settingsDraft = input.draft.settings as SiteSettings;
  const settingsPublished = input.published.settings as SiteSettings;

  const esChanges = diffLocaleDocument('es', esDraft, esPublished);
  const enChanges = diffLocaleDocument('en', enDraft, enPublished);
  const settingsChanges = diffSettings(settingsDraft, settingsPublished);

  const changes = [...esChanges, ...enChanges, ...settingsChanges];

  const parityWarnings = checkLocaleParity(
    parseContentDocument(input.draft.es),
    parseContentDocument(input.draft.en),
  ).map((issue) => ({
    label: issue.path,
    message: issue.message,
  }));

  const translationWarnings = missingEnTranslationWarnings(enDraft, enPublished, esChanges);

  const validationErrors = [
    ...validationErrorsForLocale(input.draft.es, 'ES'),
    ...validationErrorsForLocale(input.draft.en, 'EN'),
    ...validationErrorsForSettings(input.draft.settings),
  ];

  return {
    changes,
    warnings: [...translationWarnings, ...parityWarnings],
    validationErrors,
    changeCount: changes.length,
  };
}

export function reviewBlocksPublish(review: PublishReview): boolean {
  return review.validationErrors.length > 0;
}

export function reviewHasNoChanges(review: PublishReview): boolean {
  return review.changeCount === 0;
}
