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
  keyFigures: FieldErrors;
  about: {
    title?: string | null;
    foundersTitle?: string | null;
    founders: FounderErrors;
  };
  plans: FieldErrors;
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
    return `${label} es obligatorio`;
  }
  if (rules.max !== undefined && (value ?? '').length > rules.max) {
    return `${label} es demasiado largo (${(value ?? '').length}/${rules.max})`;
  }
  if (rules.email && v.length > 0 && !v.includes('@')) {
    return 'Ingresa un email válido';
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
  keyFigures: {},
  about: { founders: [] },
  plans: {},
  contact: {},
};

function buildLocaleErrors(doc: ContentDocument | null): LocaleSectionErrors {
  if (!doc) {
    return EMPTY_LOCALE_ERRORS;
  }

  return {
    hero: {
      badge: checkField(doc.hero.badge, { required: true, max: 60 }, 'Insignia'),
      headline: checkField(doc.hero.headline, { required: true, max: 90 }, 'Titular'),
      subheadline: checkField(doc.hero.subheadline, { required: true, max: 240 }, 'Subtítulo'),
      cta: checkField(doc.hero.cta, { required: true }, 'Botón principal'),
      ctaSecondary: checkField(doc.hero.ctaSecondary, { required: true }, 'Botón secundario'),
      ctaSub: checkField(doc.hero.ctaSub, { required: true }, 'Nota de confianza'),
    },
    valueProp: {
      sectionBadge: checkField(doc.valueProp.sectionBadge, { required: true }, 'Etiqueta superior'),
      title: checkField(doc.valueProp.title, { required: true, max: 90 }, 'Título de sección'),
      items: doc.valueProp.items.map((item) => ({
        title: checkField(item.title, { required: true, max: 60 }, 'Título de tarjeta'),
        description: checkField(item.description, { required: true, max: 180 }, 'Descripción de tarjeta'),
      })),
    },
    keyFigures: {
      years: checkField(doc.keyFigures.years, { required: true, max: 20 }, 'Valor de años'),
      yearsLabel: checkField(doc.keyFigures.yearsLabel, { required: true, max: 80 }, 'Etiqueta de años'),
      clientsValue: checkField(doc.keyFigures.clientsValue, { required: true, max: 20 }, 'Valor de clientes'),
      clients: checkField(doc.keyFigures.clients, { required: true, max: 80 }, 'Etiqueta de clientes'),
      projectsValue: checkField(doc.keyFigures.projectsValue, { required: true, max: 20 }, 'Valor de proyectos'),
      projects: checkField(doc.keyFigures.projects, { required: true, max: 80 }, 'Etiqueta de proyectos'),
      presenceValue: checkField(doc.keyFigures.presenceValue, { required: true, max: 20 }, 'Valor de presencia'),
      presenceLabel: checkField(doc.keyFigures.presenceLabel, { required: true, max: 80 }, 'Etiqueta de presencia'),
      presence: checkField(doc.keyFigures.presence, { required: true, max: 40 }, 'Etiqueta corta de presencia'),
      foundersCount: checkField(doc.keyFigures.foundersCount, { required: true, max: 20 }, 'Cantidad de fundadoras'),
      foundersLabel: checkField(doc.keyFigures.foundersLabel, { required: true, max: 40 }, 'Etiqueta de fundadoras'),
    },
    about: {
      title: checkField(doc.about.title, { required: true, max: 90 }, 'Título'),
      foundersTitle: checkField(doc.about.foundersTitle, { required: true, max: 300 }, 'Descripción'),
      founders: doc.about.members.map((member) => ({
        name: checkField(member.initials, { required: true, max: 40 }, 'Nombre'),
        role: checkField(member.role, { required: true, max: 40 }, 'Rol'),
      })),
    },
    plans: {
      title: checkField(doc.plans.title, { required: true, max: 90 }, 'Título'),
      subtitle: checkField(doc.plans.subtitle, { required: true, max: 240 }, 'Subtítulo'),
      cta: checkField(doc.plans.cta, { required: true, max: 40 }, 'Texto del botón'),
    },
    contact: {
      title: checkField(doc.contact.title, { required: true }, 'Título'),
      subtitle: checkField(doc.contact.subtitle, { required: true, max: 240 }, 'Descripción'),
      formName: checkField(doc.contact.form.name, { required: true }, 'Nombre completo'),
      formEmail: checkField(doc.contact.form.email, { required: true }, 'Correo electrónico'),
      formPhone: checkField(doc.contact.form.phone, { required: true }, 'Teléfono / WhatsApp'),
      formBusiness: checkField(doc.contact.form.business, { required: true }, 'Nombre del negocio'),
      formServiceType: checkField(doc.contact.form.serviceType, { required: true }, 'Tipo de servicio'),
      formMessage: checkField(doc.contact.form.message, { required: true }, 'Mensaje'),
      formSubmit: checkField(doc.contact.form.submit, { required: true }, 'Texto del botón'),
      ...Object.fromEntries(
        doc.contact.form.serviceOptions.map((option, index) => [
          `serviceOption.${index}`,
          checkField(option, { required: true }, `Opción de servicio ${index + 1}`),
        ]),
      ),
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
      siteName: checkField(form.siteName, { required: true, max: 40 }, 'Nombre del sitio'),
      whatsapp: checkField(form.whatsapp, { required: true }, 'Número de WhatsApp'),
      email: checkField(form.email, { required: true, email: true }, 'Correo de contacto'),
      address: checkField(form.address, { required: true }, 'Dirección'),
      footerText: checkField(form.footerText, { required: true }, 'Texto del pie de página'),
      siteUrl: checkField(form.siteUrl, { required: true }, 'URL del sitio'),
    };

    const hasGlobalErrors =
      countErrors(errorsEs) + countErrors(errorsEn) + countErrors(settingsErrors) > 0;

    const navErrorCount = (section: SectionId): number => {
      switch (section) {
        case 'hero':
          return countErrors(errorsEs.hero) + countErrors(errorsEn.hero);
        case 'valueProp':
          return countErrors(errorsEs.valueProp) + countErrors(errorsEn.valueProp);
        case 'keyFigures':
          return countErrors(errorsEs.keyFigures) + countErrors(errorsEn.keyFigures);
        case 'about':
          return countErrors(errorsEs.about) + countErrors(errorsEn.about);
        case 'plans':
          return countErrors(errorsEs.plans) + countErrors(errorsEn.plans);
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
  if (section === 'hero' || section === 'keyFigures' || section === 'plans' || section === 'contact') {
    return errors[section][field] ?? null;
  }
  return null;
}
