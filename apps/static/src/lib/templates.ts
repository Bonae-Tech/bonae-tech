import type { ContentDocument } from '@bonae/content';

export type TemplateItem = ContentDocument['templates']['items'][number];

export function templateDetailPath(lang: ContentDocument['lang'], slug: string): string {
  return lang === 'en' ? `/en/templates/${slug}` : `/plantillas/${slug}`;
}

export function templatesSectionHref(lang: ContentDocument['lang']): string {
  return lang === 'en' ? '/en/#plantillas' : '/#plantillas';
}

export function liveTemplates(doc: ContentDocument): TemplateItem[] {
  return doc.templates.items.filter((item) => !item.comingSoon && item.slug.trim());
}

export function findTemplateBySlug(doc: ContentDocument, slug: string): TemplateItem | undefined {
  return liveTemplates(doc).find((item) => item.slug === slug);
}
