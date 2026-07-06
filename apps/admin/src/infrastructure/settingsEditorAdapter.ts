import type { ContentDocument, SiteSettings } from '@bonae/content';

export interface SettingsFormValues {
  siteName: string;
  whatsapp: string;
  email: string;
  address: string;
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
