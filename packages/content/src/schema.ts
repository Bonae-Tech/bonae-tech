import { z } from 'zod';
import { valuePropIcons } from './icons.js';

export const localeSchema = z.enum(['es', 'en']);

const iconItemSchema = z.object({
  icon: z.enum(valuePropIcons),
  title: z.string().min(1),
  description: z.string().min(1),
  backLabel: z.string().min(1),
  backDescription: z.string().min(1),
});

const memberSchema = z.object({
  initials: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1),
});

export const contentDocumentSchema = z.object({
  lang: localeSchema,
  siteName: z.string().min(1),
  siteTagline: z.string().min(1),
  metaDescription: z.string().min(1),

  nav: z.object({
    home: z.string().min(1),
    about: z.string().min(1),
    valueProp: z.string().min(1),
    portfolio: z.string().min(1),
    contact: z.string().min(1),
    cta: z.string().min(1),
    clients: z.string().min(1),
    team: z.string().min(1),
    langSwitch: z.string().min(1),
    langSwitchHref: z.string().min(1),
  }),

  hero: z.object({
    badge: z.string().min(1),
    headline: z.string().min(1),
    subheadline: z.string().min(1),
    cta: z.string().min(1),
    ctaSecondary: z.string().min(1),
    ctaSub: z.string().min(1),
  }),

  valueProp: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    subheadline: z.string().min(1),
    items: z.array(iconItemSchema).min(1).max(8),
  }),

  keyFigures: z.object({
    years: z.string().min(1),
    yearsLabel: z.string().min(1),
    clients: z.string().min(1),
    clientsValue: z.string().min(1),
    projects: z.string().min(1),
    projectsValue: z.string().min(1),
    presence: z.string().min(1),
    presenceLabel: z.string().min(1),
    presenceValue: z.string().min(1),
    foundersCount: z.string().min(1),
    foundersLabel: z.string().min(1),
  }),

  about: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    foundersTitle: z.string().min(1),
    members: z.array(memberSchema).length(3),
  }),

  portfolio: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    industries: z.object({
      title: z.string().min(1),
      items: z.array(z.string().min(1)).min(1),
    }),
    comingSoon: z.string().min(1),
  }),

  testimonials: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    comingSoon: z.string().min(1),
  }),

  plans: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    cta: z.string().min(1),
    ctaSub: z.string().min(1),
    note: z.string().min(1),
  }),

  contact: z.object({
    sectionBadge: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    form: z.object({
      name: z.string().min(1),
      email: z.string().min(1),
      phone: z.string().min(1),
      business: z.string().min(1),
      serviceType: z.string().min(1),
      message: z.string().min(1),
      submit: z.string().min(1),
      serviceOptions: z.array(z.string().min(1)).min(1),
    }),
    whatsappText: z.string().min(1),
    whatsappMessage: z.string().min(1),
    emailText: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    hours: z.string().min(1),
    location: z.string().min(1),
    locationNote: z.string().min(1),
  }),

  footer: z.object({
    tagline: z.string().min(1),
    description: z.string().min(1),
    nav: z.object({
      title: z.string().min(1),
      home: z.string().min(1),
      about: z.string().min(1),
      services: z.string().min(1),
      portfolio: z.string().min(1),
      contact: z.string().min(1),
    }),
    services: z.object({
      title: z.string().min(1),
      web: z.string().min(1),
      social: z.string().min(1),
      crm: z.string().min(1),
      consulting: z.string().min(1),
    }),
    legal: z.object({
      privacy: z.string().min(1),
      terms: z.string().min(1),
      cookies: z.string().min(1),
    }),
    copyright: z.string().min(1),
  }),

  cookieBanner: z.object({
    message: z.string().min(1),
    accept: z.string().min(1),
    privacy: z.string().min(1),
    ariaLabel: z.string().min(1),
  }),
});

export const siteSettingsSchema = z.object({
  siteUrl: z.string().url(),
  whatsappNumber: z.string().regex(/^\d{10,15}$/),
  socialLinks: z.object({
    instagram: z.string(),
    facebook: z.string(),
    linkedin: z.string(),
  }),
  legalLinks: z.object({
    privacy: z.string(),
    terms: z.string(),
    cookies: z.string(),
  }),
});

export type ContentDocument = z.infer<typeof contentDocumentSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type Locale = z.infer<typeof localeSchema>;

export function parseContentDocument(data: unknown): ContentDocument {
  return contentDocumentSchema.parse(data);
}

export function parseSiteSettings(data: unknown): SiteSettings {
  return siteSettingsSchema.parse(data);
}
