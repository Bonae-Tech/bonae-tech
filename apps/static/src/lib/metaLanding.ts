import { buildWhatsAppHref } from '@bonae/content';

export type MetaLandingLang = 'es' | 'en';

export interface MetaLandingCopy {
  lang: MetaLandingLang;
  pageTitle: string;
  pageDescription: string;
  badge: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustSameDay: string;
  trustRegion: string;
  offersTitle: string;
  offers: { title: string; description: string }[];
  pricingTitle: string;
  pricingLead: string;
  pricingFrom: string;
  pricingCta: string;
  stepsTitle: string;
  steps: { title: string; description: string }[];
  finalTitle: string;
  finalLead: string;
  siteLinkLabel: string;
  legalNote: string;
  whatsappMessage: string;
}

const es: MetaLandingCopy = {
  lang: 'es',
  pageTitle: 'BONAE TECH — Digitaliza tu negocio',
  pageDescription:
    'Sitios web, catálogos, tiendas en línea y herramientas de gestión con plantillas propias. Publicamos en días, no meses. Consulta por WhatsApp.',
  badge: 'Oferta para anuncios Meta',
  headline: 'Tu negocio en internet, listo en días',
  subheadline:
    'Plantillas propias, ágiles y adaptadas a tu marca. Precios claros, editor sencillo y el producto final es tuyo.',
  primaryCta: 'Quiero una cotización por WhatsApp',
  secondaryCta: 'Ver precios en la web',
  trustSameDay: 'Te respondemos el mismo día',
  trustRegion: 'Venezuela · Latinoamérica · remoto',
  offersTitle: 'Qué puedes lanzar con nosotros',
  offers: [
    {
      title: 'Productos Web',
      description: 'OnePage, Multipage y Landing Page optimizados para Google y conversiones.',
    },
    {
      title: 'Gestión de negocio',
      description: 'Catálogo digital, tienda virtual y sistema de ventas con panel administrativo.',
    },
    {
      title: 'Redes, CRM y campañas',
      description: 'Integración para no perder leads y potenciar tu operación comercial.',
    },
    {
      title: 'Consultoría y IA',
      description: 'Mejoramos tu web actual e incluimos chatbot con IA según tu plan.',
    },
  ],
  pricingTitle: 'Precios desde',
  pricingLead: 'Ofertas en USD · pago único o precio inicial según producto',
  pricingFrom: 'Landing Page desde $99 · OnePage desde $149 · Catálogo desde $199',
  pricingCta: 'Ver todas las plantillas',
  stepsTitle: 'Cómo empezamos',
  steps: [
    { title: '1. Escríbenos', description: 'Cuéntanos tu negocio y qué quieres lograr.' },
    { title: '2. Elegimos plantilla', description: 'Te recomendamos el producto y plan que encajan.' },
    { title: '3. Publicamos', description: 'Personalizamos, publicamos y te entregamos tu sitio.' },
  ],
  finalTitle: '¿Listo para digitalizar tu marca?',
  finalLead: 'Un mensaje y te orientamos sin compromiso.',
  siteLinkLabel: 'Ir al sitio completo bonaetech.com',
  legalNote: 'Al contactarnos aceptas nuestra política de privacidad.',
  whatsappMessage:
    'Hola BONAE TECH, vi su anuncio en Meta y me gustaría conocer sus servicios y precios.',
};

const en: MetaLandingCopy = {
  lang: 'en',
  pageTitle: 'BONAE TECH — Grow your business online',
  pageDescription:
    'Websites, catalogs, online stores, and business tools with our own templates. Live in days, not months. Message us on WhatsApp.',
  badge: 'Meta ads offer',
  headline: 'Get your business online in days',
  subheadline:
    'Our own agile templates, tailored to your brand. Clear pricing, simple editor, and you own the final product.',
  primaryCta: 'Get a quote on WhatsApp',
  secondaryCta: 'See pricing on the website',
  trustSameDay: 'We reply the same day',
  trustRegion: 'Venezuela · Latin America · remote',
  offersTitle: 'What you can launch with us',
  offers: [
    {
      title: 'Web products',
      description: 'OnePage, Multipage, and landing pages built for Google and conversions.',
    },
    {
      title: 'Business management',
      description: 'Digital catalog, online store, and sales system with an admin dashboard.',
    },
    {
      title: 'Social, CRM & campaigns',
      description: 'Integrations so you do not lose leads and can scale sales.',
    },
    {
      title: 'Consulting & AI',
      description: 'We improve your current site and can add an AI chatbot on select plans.',
    },
  ],
  pricingTitle: 'Starting at',
  pricingLead: 'Prices in USD · one-time or starting price depending on product',
  pricingFrom: 'Landing Page from $99 · OnePage from $149 · Catalog from $199',
  pricingCta: 'See all templates',
  stepsTitle: 'How we start',
  steps: [
    { title: '1. Message us', description: 'Tell us about your business and goals.' },
    { title: '2. Pick a template', description: 'We recommend the product and plan that fit.' },
    { title: '3. Go live', description: 'We customize, publish, and hand off your site.' },
  ],
  finalTitle: 'Ready to digitize your brand?',
  finalLead: 'One message — we will guide you with no obligation.',
  siteLinkLabel: 'Go to full site bonaetech.com',
  legalNote: 'By contacting us you accept our privacy policy.',
  whatsappMessage:
    'Hello BONAE TECH, I saw your Meta ad and would like to learn about your services and pricing.',
};

export function metaLandingFor(lang: MetaLandingLang): MetaLandingCopy {
  return lang === 'en' ? en : es;
}

/** Builds WhatsApp link; appends UTM/ref from the landing URL when present (client updates href). */
export function metaWhatsAppHref(number: string, copy: MetaLandingCopy, ref?: string): string {
  const suffix = ref ? ` (ref: ${ref})` : '';
  return buildWhatsAppHref(number, `${copy.whatsappMessage}${suffix}`);
}

export function metaLandingPaths(lang: MetaLandingLang) {
  const home = lang === 'en' ? '/en/' : '/';
  return {
    home,
    self: lang === 'en' ? '/en/meta/' : '/meta/',
    templates: `${home}#plantillas`,
    privacy: lang === 'en' ? '/en/privacy-policy/' : '/politica-de-privacidad/',
  };
}
