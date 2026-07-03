import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

export interface SiteContent {
  lang: 'es';
  siteName: string;
  siteTagline: string;
  metaDescription: string;
  nav: {
    home: string;
    menu: string;
    hours: string;
    contact: string;
    cta: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  menu: {
    title: string;
    subtitle: string;
    items: MenuItem[];
  };
  hours: {
    title: string;
    schedule: string;
    address: string;
  };
  contact: {
    title: string;
    text: string;
    email: string;
    whatsappMessage: string;
  };
  cookieBanner: {
    ariaLabel: string;
    message: string;
    privacy: string;
    accept: string;
  };
  footer: {
    description: string;
    copyright: string;
    legal: {
      privacy: string;
      terms: string;
      cookies: string;
    };
  };
}

export interface SiteSettings {
  siteUrl: string;
  whatsappNumber: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  legalLinks: {
    privacy: string;
    terms: string;
    cookies: string;
  };
}

const contentRoot = join(import.meta.dirname, '../../content/published');

export const content: SiteContent = JSON.parse(
  readFileSync(join(contentRoot, 'es.json'), 'utf8'),
);

export const settings: SiteSettings = JSON.parse(
  readFileSync(join(contentRoot, 'settings.json'), 'utf8'),
);

export function whatsappHref(message: string): string {
  return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
