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

export function whatsappHrefForTemplate(t: ContentDocument, templateTitle: string): string {
  const base = t.contact.whatsappMessage.trim();
  const suffix =
    t.lang === 'en'
      ? ` I am interested in the "${templateTitle}" template.`
      : ` Me interesa la plantilla "${templateTitle}".`;
  return buildWhatsAppHref(siteSettings.whatsappNumber, `${base}${suffix}`);
}

export type { ContentDocument as Translations, SiteSettings } from '@bonae/content';
