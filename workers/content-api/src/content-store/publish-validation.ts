import {
  checkLocaleParity,
  parseContentDocument,
  parseSiteSettings,
  type ContentDocument,
  type SiteSettings,
} from '@bonae/content';

export type ValidatedDrafts = {
  es: ContentDocument;
  en: ContentDocument;
  settings: SiteSettings;
};

export type PublishValidationResult =
  | { ok: true; drafts: ValidatedDrafts }
  | { ok: false; errors: string[] };

export function validateDraftsForPublish(drafts: {
  es: unknown;
  en: unknown;
  settings: unknown;
}): PublishValidationResult {
  const errors: string[] = [];
  let es: ContentDocument | undefined;
  let en: ContentDocument | undefined;
  let settings: SiteSettings | undefined;

  try {
    es = parseContentDocument(drafts.es);
  } catch (err) {
    errors.push(`es: ${err instanceof Error ? err.message : 'invalid document'}`);
  }

  try {
    en = parseContentDocument(drafts.en);
  } catch (err) {
    errors.push(`en: ${err instanceof Error ? err.message : 'invalid document'}`);
  }

  try {
    settings = parseSiteSettings(drafts.settings);
  } catch (err) {
    errors.push(`settings: ${err instanceof Error ? err.message : 'invalid document'}`);
  }

  if (es && en) {
    for (const issue of checkLocaleParity(es, en)) {
      errors.push(`${issue.path}: ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, drafts: { es: es!, en: en!, settings: settings! } };
}
