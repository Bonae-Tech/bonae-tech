export {
  contentDocumentSchema,
  siteSettingsSchema,
  localeSchema,
  parseContentDocument,
  parseSiteSettings,
  type ContentDocument,
  type SiteSettings,
  type Locale,
} from './schema.js';
export { valuePropIcons, type ValuePropIcon } from './icons.js';
export { checkLocaleParity, assertLocaleParity } from './validate.js';
export {
  loadPublishedFromDir,
  loadLocaleFromDir,
  loadSettingsFromDir,
  buildWhatsAppHref,
  type PublishedContentBundle,
} from './load.js';

/** Alias for Astro components that previously used Translations from es.ts */
export type { ContentDocument as Translations } from './schema.js';
