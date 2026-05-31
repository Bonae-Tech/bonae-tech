import { join } from 'node:path';
import {
  loadPublishedFromDir,
  buildWhatsAppHref,
  type ContentDocument,
  type SiteSettings,
} from '@bonae/content';

const contentRoot = join(import.meta.dirname, '../../content');
const bundle = loadPublishedFromDir(contentRoot);

export const publishedEs: ContentDocument = bundle.es;
export const publishedEn: ContentDocument = bundle.en;
export const siteSettings: SiteSettings = bundle.settings;

export function whatsappHrefFor(t: ContentDocument): string {
  return buildWhatsAppHref(siteSettings.whatsappNumber, t.contact.whatsappMessage);
}

export type { ContentDocument as Translations, SiteSettings } from '@bonae/content';
