import { buildWhatsAppHref } from '@bonae/content';

export type MetaLandingLang = 'es' | 'en';

export interface MetaPriceCard {
  label: string;
  price: string;
  note: string;
  highlight?: boolean;
}

export interface MetaLandingCopy {
  lang: MetaLandingLang;
  pageTitle: string;
  pageDescription: string;
  urgencyStrip: string;
  headline: string;
  subheadline: string;
  heroBullets: string[];
  primaryCta: string;
  ctaNote: string;
  priceSectionTitle: string;
  popularBadge: string;
  priceCards: MetaPriceCard[];
  priceFootnote: string;
  panelTitle: string;
  panelLead: string;
  steps: { title: string; description: string }[];
  siteLinkLabel: string;
  legalNote: string;
  whatsappMessage: string;
  deviceImageAlt: string;
}

const es: MetaLandingCopy = {
  lang: 'es',
  pageTitle: 'Cotiza tu web — BONAE TECH',
  pageDescription:
    'Landing, OnePage y catálogo digital con precio claro. Publicamos en días. Cotiza por WhatsApp sin compromiso.',
  urgencyStrip: 'Consulta gratis · Te respondemos hoy · Venezuela y Latinoamérica',
  headline: 'Publica tu negocio en internet con OnePage por $149',
  subheadline:
    'No necesitas meses ni un equipo técnico: tenemos plantillas propias elaboradas para vender, la personalizamos y te entregamos un producto tuyo.',
  heroBullets: [
    'Plantillas propias listas para tu marca',
    'Editor sencillo para cambios básicos',
    'Hosting y dominio incluidos 1 año (condiciones)',
    'Catálogo, tienda o web corporativa según tu meta',
  ],
  primaryCta: 'Cotizar por WhatsApp',
  ctaNote: 'Sin formularios largos: escríbenos y te guiamos en minutos.',
  priceSectionTitle: 'Paquetes más pedidos en Meta',
  popularBadge: 'Más pedido',
  priceCards: [
    { label: 'Landing Page', price: '$99', note: 'pago único · 1 campaña' },
    { label: 'OnePage', price: '$149', note: 'oferta · presencia completa', highlight: true },
    { label: 'Catálogo digital', price: '$199', note: 'oferta · vende por WhatsApp' },
  ],
  priceFootnote: 'Precios en USD. Otros productos (Multipage, tienda, CRM) en el sitio.',
  panelTitle: 'En 3 pasos publicamos contigo',
  panelLead: 'Así trabajamos contigo desde el primer mensaje:',
  steps: [
    { title: 'Cuéntanos tu negocio', description: 'Qué vendes y qué quieres lograr con la web.' },
    { title: 'Elegimos plantilla', description: 'Te recomendamos plan y funciones sin sorpresas.' },
    { title: 'Entrega en días', description: 'Personalizamos, publicamos y te capacitamos en lo básico.' },
  ],
  siteLinkLabel: 'Ver catálogo completo en bonaetech.com',
  legalNote: 'Al escribirnos aceptas nuestra política de privacidad.',
  whatsappMessage:
    'Hola BONAE TECH, vi su anuncio en Meta y quiero cotizar una web para mi negocio.',
  deviceImageAlt: 'Vista previa de sitio web corporativo BONAE TECH',
};

const en: MetaLandingCopy = {
  lang: 'en',
  pageTitle: 'Quote your website — BONAE TECH',
  pageDescription:
    'Landing, OnePage, and digital catalog with clear pricing. Live in days. Message us on WhatsApp.',
  urgencyStrip: 'Free inquiry · Same-day reply · Venezuela & Latin America',
  headline: 'Get your business online with OnePage for $149',
  subheadline:
    'No months-long projects: we have our own templates built to sell, we customize yours, and you own the final product.',
  heroBullets: [
    'Ready-made templates tailored to your brand',
    'Simple editor for basic updates',
    'Hosting & domain included 1 year (conditions apply)',
    'Catalog, store, or corporate site based on your goal',
  ],
  primaryCta: 'Get a quote on WhatsApp',
  ctaNote: 'No long forms — message us and we will guide you in minutes.',
  priceSectionTitle: 'Top packages from our Meta campaigns',
  popularBadge: 'Top pick',
  priceCards: [
    { label: 'Landing Page', price: '$99', note: 'one-time · one campaign' },
    { label: 'OnePage', price: '$149', note: 'offer · full presence', highlight: true },
    { label: 'Digital catalog', price: '$199', note: 'offer · sell via WhatsApp' },
  ],
  priceFootnote: 'Prices in USD. More products (Multipage, store, CRM) on the main site.',
  panelTitle: 'We publish with you in 3 steps',
  panelLead: 'How we work from your first message:',
  steps: [
    { title: 'Tell us about your business', description: 'What you sell and what you want the site to do.' },
    { title: 'Pick a template', description: 'We recommend plan and features with clear pricing.' },
    { title: 'Delivery in days', description: 'We customize, launch, and show you the basics.' },
  ],
  siteLinkLabel: 'See full catalog at bonaetech.com',
  legalNote: 'By messaging us you accept our privacy policy.',
  whatsappMessage:
    'Hello BONAE TECH, I saw your Meta ad and would like a quote for a website for my business.',
  deviceImageAlt: 'Preview of a BONAE TECH corporate website',
};

export function metaLandingFor(lang: MetaLandingLang): MetaLandingCopy {
  return lang === 'en' ? en : es;
}

export function metaWhatsAppHref(number: string, copy: MetaLandingCopy, ref?: string): string {
  const suffix = ref ? ` (ref: ${ref})` : '';
  return buildWhatsAppHref(number, `${copy.whatsappMessage}${suffix}`);
}

export function metaLandingPaths(lang: MetaLandingLang) {
  const home = lang === 'en' ? '/en/' : '/';
  return {
    home,
    templates: `${home}#plantillas`,
    privacy: lang === 'en' ? '/en/privacy-policy/' : '/politica-de-privacidad/',
  };
}
