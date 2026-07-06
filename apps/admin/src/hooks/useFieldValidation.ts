import { useMemo } from 'react';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import { readSettingsForm } from '../infrastructure/settingsEditorAdapter.js';
import type { SectionId } from '../ui/editor/types.js';

export type FieldErrors = Record<string, string | null | undefined>;
type ItemErrors = Array<{ title?: string | null; description?: string | null }>;
type FounderErrors = Array<{ name?: string | null; role?: string | null }>;

export interface LocaleSectionErrors {
  hero: FieldErrors;
  valueProp: {
    sectionBadge?: string | null;
    title?: string | null;
    items: ItemErrors;
  };
  about: {
    title?: string | null;
    foundersTitle?: string | null;
    founders: FounderErrors;
  };
  contact: FieldErrors;
}

export interface ValidationState {
  errorsEs: LocaleSectionErrors;
  errorsEn: LocaleSectionErrors;
  settingsErrors: FieldErrors;
  hasGlobalErrors: boolean;
  navErrorCount: (section: SectionId) => number;
}

function checkField(
  value: string | undefined,
  rules: { required?: boolean; max?: number; email?: boolean },
  label: string,
): string | null {
  const v = (value ?? '').trim();
  if (rules.required && v.length === 0) {
    return `${label} is required`;
  }
  if (rules.max !== undefined && (value ?? '').length > rules.max) {
    return `${label} is too long (${(value ?? '').length}/${rules.max})`;
  }
  if (rules.email && v.length > 0 && !v.includes('@')) {
    return 'Enter a valid email';
  }
  return null;
}

function countErrors(obj: unknown): number {
  if (!obj) {
    return 0;
  }
  if (typeof obj === 'string') {
    return obj ? 1 : 0;
  }
  if (Array.isArray(obj)) {
    return obj.reduce<number>((n, item) => n + countErrors(item), 0);
  }
  if (typeof obj === 'object') {
    return Object.values(obj as Record<string, unknown>).reduce<number>(
      (n, v) => n + countErrors(v),
      0,
    );
  }
  return 0;
}

const EMPTY_LOCALE_ERRORS: LocaleSectionErrors = {
  hero: {},
  valueProp: { items: [] },
  about: { founders: [] },
  contact: {},
};

function buildLocaleErrors(doc: ContentDocument | null): LocaleSectionErrors {
  if (!doc) {
    return EMPTY_LOCALE_ERRORS;
  }

  return {
    hero: {
      badge: checkField(doc.hero.badge, { required: true, max: 60 }, 'Badge'),
      headline: checkField(doc.hero.headline, { required: true, max: 90 }, 'Headline'),
      subheadline: checkField(doc.hero.subheadline, { required: true, max: 240 }, 'Subheadline'),
      cta: checkField(doc.hero.cta, { required: true }, 'Primary button'),
      ctaSecondary: checkField(doc.hero.ctaSecondary, { required: true }, 'Secondary button'),
      ctaSub: checkField(doc.hero.ctaSub, { required: true }, 'Trust note'),
    },
    valueProp: {
      sectionBadge: checkField(doc.valueProp.sectionBadge, { required: true }, 'Eyebrow label'),
      title: checkField(doc.valueProp.title, { required: true, max: 90 }, 'Section title'),
      items: doc.valueProp.items.map((item) => ({
        title: checkField(item.title, { required: true, max: 60 }, 'Card title'),
        description: checkField(item.description, { required: true, max: 160 }, 'Card description'),
      })),
    },
    about: {
      title: checkField(doc.about.title, { required: true, max: 90 }, 'Title'),
      foundersTitle: checkField(doc.about.foundersTitle, { required: true, max: 300 }, 'Description'),
      founders: doc.about.members.map((member) => ({
        name: checkField(member.initials, { required: true, max: 40 }, 'Name'),
        role: checkField(member.role, { required: true, max: 40 }, 'Role'),
      })),
    },
    contact: {
      title: checkField(doc.contact.title, { required: true }, 'Title'),
      subtitle: checkField(doc.contact.subtitle, { required: true, max: 240 }, 'Description'),
    },
  };
}

export function useFieldValidation(
  draftEs: ContentDocument | null,
  draftEn: ContentDocument | null,
  draftSettings: SiteSettings | null,
): ValidationState {
  return useMemo(() => {
    const errorsEs = buildLocaleErrors(draftEs);
    const errorsEn = buildLocaleErrors(draftEn);
    const form = readSettingsForm(draftEs, draftSettings);
    const settingsErrors: FieldErrors = {
      siteName: checkField(form.siteName, { required: true, max: 40 }, 'Site name'),
      whatsapp: checkField(form.whatsapp, { required: true }, 'WhatsApp number'),
      email: checkField(form.email, { required: true, email: true }, 'Contact email'),
      address: checkField(form.address, { required: true }, 'Address'),
      footerText: checkField(form.footerText, { required: true }, 'Footer text'),
      siteUrl: checkField(form.siteUrl, { required: true }, 'Site URL'),
    };

    const hasGlobalErrors =
      countErrors(errorsEs) + countErrors(errorsEn) + countErrors(settingsErrors) > 0;

    const navErrorCount = (section: SectionId): number => {
      switch (section) {
        case 'hero':
          return countErrors(errorsEs.hero) + countErrors(errorsEn.hero);
        case 'valueProp':
          return countErrors(errorsEs.valueProp) + countErrors(errorsEn.valueProp);
        case 'about':
          return countErrors(errorsEs.about) + countErrors(errorsEn.about);
        case 'contact':
          return countErrors(errorsEs.contact) + countErrors(errorsEn.contact);
        case 'settings':
          return countErrors(settingsErrors);
        default:
          return 0;
      }
    };

    return {
      errorsEs,
      errorsEn,
      settingsErrors,
      hasGlobalErrors,
      navErrorCount,
    };
  }, [draftEs, draftEn, draftSettings]);
}

export function getLocaleFieldError(
  errors: LocaleSectionErrors,
  section: keyof LocaleSectionErrors,
  field: string,
  index?: number,
  subField?: string,
): string | null {
  if (section === 'valueProp') {
    if (field === 'items' && index !== undefined && subField) {
      return errors.valueProp.items[index]?.[subField as 'title' | 'description'] ?? null;
    }
    return errors.valueProp[field as 'sectionBadge' | 'title'] ?? null;
  }
  if (section === 'about') {
    if (field === 'founders' && index !== undefined && subField) {
      return errors.about.founders[index]?.[subField as 'name' | 'role'] ?? null;
    }
    return errors.about[field as 'title' | 'foundersTitle'] ?? null;
  }
  if (section === 'hero' || section === 'contact') {
    return errors[section][field] ?? null;
  }
  return null;
}
