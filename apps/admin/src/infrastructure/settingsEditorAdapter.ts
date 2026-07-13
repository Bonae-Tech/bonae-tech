import type { BusinessHoursDay, ContentDocument, SiteSettings } from '@bonae/content/schema';
import { defaultBusinessHoursDays } from '@bonae/content/schema';

export interface SettingsFormValues {
  siteName: string;
  whatsapp: string;
  email: string;
  address: string;
  hoursDays: BusinessHoursDay[];
  footerText: string;
  siteUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
}

export function readSettingsForm(
  draftEs: ContentDocument | null,
  draftSettings: SiteSettings | null,
): SettingsFormValues {
  return {
    siteName: draftEs?.siteName ?? '',
    whatsapp: draftSettings?.whatsappNumber ?? '',
    email: draftEs?.contact.email ?? '',
    address: draftEs?.contact.locationNote ?? '',
    hoursDays: draftEs?.contact.hours.days ?? defaultBusinessHoursDays(),
    footerText: draftEs?.footer.copyright ?? '',
    siteUrl: draftSettings?.siteUrl ?? '',
    socialInstagram: draftSettings?.socialLinks.instagram ?? '',
    socialFacebook: draftSettings?.socialLinks.facebook ?? '',
    socialLinkedin: draftSettings?.socialLinks.linkedin ?? '',
  };
}

export function applySettingsForm(
  values: SettingsFormValues,
  draftEs: ContentDocument,
  draftEn: ContentDocument,
  draftSettings: SiteSettings,
): { es: ContentDocument; en: ContentDocument; settings: SiteSettings } {
  const patchDoc = (doc: ContentDocument): ContentDocument => ({
    ...doc,
    siteName: values.siteName,
    contact: {
      ...doc.contact,
      email: values.email,
      locationNote: values.address,
      hours: {
        ...doc.contact.hours,
        // Schedule times are shared; locale-specific title is preserved per document.
        days: values.hoursDays,
      },
    },
    footer: {
      ...doc.footer,
      copyright: values.footerText,
    },
  });

  return {
    es: patchDoc(draftEs),
    en: patchDoc(draftEn),
    settings: {
      ...draftSettings,
      siteUrl: values.siteUrl,
      whatsappNumber: values.whatsapp.replace(/\D/g, ''),
      socialLinks: {
        instagram: values.socialInstagram,
        facebook: values.socialFacebook,
        linkedin: values.socialLinkedin,
      },
    },
  };
}
