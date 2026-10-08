import type { ContentDocument } from '@bonae/content';

export type TemplatePlanId = 'standard' | 'full';

export interface TemplatePlan {
  id: TemplatePlanId;
  price: number;
  /** Shown struck through next to `price` as an offer. */
  originalPrice?: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  plans: TemplatePlan[];
  features: string[];
  excludedFeatures?: string[];
  /** Existing template shown by "Ver plantilla"; null opens the coming-soon modal. */
  sampleSlug: string | null;
  featured?: boolean;
}

interface CategoriesCopy {
  priceLabel: string;
  offerNote: string;
  showMoreLabel: string;
  showLessLabel: string;
  planLabels: Record<TemplatePlanId, string>;
  featuredLabel: string;
  viewTemplateLabel: string;
  categories: TemplateCategory[];
}

const es: CategoriesCopy = {
  priceLabel: 'Modelo Estándar',
  offerNote: 'Oferta limitada',
  showMoreLabel: 'Ver más',
  showLessLabel: 'Ver menos',
  planLabels: { standard: 'Estándar', full: 'Premium' },
  featuredLabel: 'Más solicitado',
  viewTemplateLabel: 'Ver plantilla',
  categories: [
    {
      id: 'onepage',
      name: 'OnePage',
      tagline: 'Todo tu negocio en una sola página',
      description:
        'Sitio de una sola página, obtén presencia rápida y efectiva.',
      plans: [
        { id: 'standard', price: 99, originalPrice: 120 },
        { id: 'full', price: 250, originalPrice: 270 },
      ],
      features: [
        'Hasta 6 secciones para contar todo sobre tu negocio',
        'Botón de WhatsApp para atenderlos al instante',
        'Se ve perfecta en celulares, tablets y computadoras',
        'Aparece en Google para que tus clientes te encuentren fácil',
        'Enlaces a todas tus redes sociales',
        'Formulario para que tus clientes te escriban',
        '15 días de mantenimiento gratis',
        'Hosting incluido: tu página siempre en línea',
        'Dominio incluido: tu propia dirección web (aplican condiciones)',
      ],
      excludedFeatures: ['No incluye diseño de marca personal (logo, colores)'],
      sampleSlug: 'modelo-2',
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'Un sitio corporativo completo',
      description:
        'Sitio con varias páginas independientes para empresas que necesitan presentar servicios, equipo y contenido en profundidad.',
      plans: [{ id: 'standard', price: 180 }],
      features: [
        'Hasta 6 páginas para mostrar todo lo que ofreces',
        'Menú claro para que tus visitantes no se pierdan',
        'Blog para compartir noticias y novedades',
        'Disponible en español e inglés',
        'Aparece en Google y te muestra cuántas personas te visitan',
      ],
      sampleSlug: null,
    },
    {
      id: 'landing',
      name: 'LandingPage',
      tagline: 'Diseñada para convertir',
      description:
        'Página enfocada en una sola oferta o campaña, pensada para captar clientes potenciales desde anuncios y redes sociales.',
      plans: [{ id: 'standard', price: 80 }],
      features: [
        'Pensada para convertir visitantes en clientes',
        'Botones llamativos que invitan a comprar o contactarte',
        'Formulario para recibir los datos de interesados',
        'Opiniones de clientes que generan confianza',
        'Carga muy rápido, ideal para tus anuncios en redes',
      ],
      sampleSlug: null,
    },
    {
      id: 'catalog',
      name: 'Catálogo Digital',
      tagline: 'Muestra tus productos sin complicaciones',
      description:
        'Catálogo en línea para exhibir productos con precios y fotos; tus clientes consultan y piden directamente por WhatsApp.',
      plans: [{ id: 'standard', price: 120 }],
      features: [
        'Tus productos ordenados por categorías',
        'Cada producto con fotos, precio y detalles',
        'Tus clientes te hacen pedidos directo por WhatsApp',
        'Buscador para encontrar productos en segundos',
        'Actualiza precios y productos cuando quieras',
      ],
      sampleSlug: 'modelo-5',
    },
    {
      id: 'store',
      name: 'Tienda Virtual',
      tagline: 'Vende en línea las 24 horas',
      description:
        'Tienda en línea completa con carrito de compras y gestión de productos para negocios que quieren vender sin intermediarios.',
      plans: [{ id: 'standard', price: 150 }],
      features: [
        'Carrito de compras para que tus clientes compren solos',
        'Controla tu inventario y tus productos',
        'Crea ofertas y cupones de descuento',
        'Recibe pagos en línea',
        'Opiniones de clientes y enlaces a tus redes',
      ],
      sampleSlug: 'modelo-4',
      featured: true,
    },
    {
      id: 'sales',
      name: 'Sistemas de Ventas',
      tagline: 'Controla tu operación comercial',
      description:
        'Panel administrativo para gestionar ventas, contratos, pagos y vendedores con métricas en tiempo real.',
      plans: [{ id: 'standard', price: 300 }],
      features: [
        'Sigue tus contratos y pedidos en tiempo real',
        'Mira cuánto te deben y cuánto has cobrado',
        'Registra pagos por Zelle, PayPal, Binance o efectivo',
        'Descarga reportes de ventas por vendedor',
        'Úsalo desde tu celular, tablet o computadora',
      ],
      sampleSlug: 'modelo-3',
    },
  ],
};

const en: CategoriesCopy = {
  priceLabel: 'Standard Model',
  offerNote: 'Limited-time offer',
  showMoreLabel: 'Show more',
  showLessLabel: 'Show less',
  planLabels: { standard: 'Standard', full: 'Premium' },
  featuredLabel: 'Most popular',
  viewTemplateLabel: 'View template',
  categories: [
    {
      id: 'onepage',
      name: 'OnePage',
      tagline: 'Your whole business on one page',
      description:
        'A single-page site to get a fast, effective online presence.',
      plans: [
        { id: 'standard', price: 99, originalPrice: 120 },
        { id: 'full', price: 250, originalPrice: 270 },
      ],
      features: [
        'Up to 6 sections to tell your business story',
        'WhatsApp button to reply instantly',
        'Looks great on phones, tablets and computers',
        'Shows up on Google so customers find you easily',
        'Links to all your social media',
        'A form so customers can reach you',
        '15 days of free maintenance',
        'Hosting included: your site always online',
        'Domain included: your own web address (conditions apply)',
      ],
      excludedFeatures: ['Personal brand design not included (logo, colors)'],
      sampleSlug: 'modelo-2',
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'A complete corporate website',
      description:
        'A site with several standalone pages for companies that need to present services, team and content in depth.',
      plans: [{ id: 'standard', price: 180 }],
      features: [
        'Up to 6 pages to show everything you offer',
        'Clear menu so visitors never get lost',
        'Blog to share news and updates',
        'Available in Spanish and English',
        'Shows up on Google and tells you how many people visit',
      ],
      sampleSlug: null,
    },
    {
      id: 'landing',
      name: 'LandingPage',
      tagline: 'Built to convert',
      description:
        'A page focused on a single offer or campaign, designed to capture leads from ads and social media.',
      plans: [{ id: 'standard', price: 80 }],
      features: [
        'Designed to turn visitors into customers',
        'Eye-catching buttons that invite people to buy or contact you',
        'Form to collect details from interested people',
        'Customer reviews that build trust',
        'Loads super fast, perfect for your social media ads',
      ],
      sampleSlug: null,
    },
    {
      id: 'catalog',
      name: 'Digital Catalog',
      tagline: 'Showcase your products effortlessly',
      description:
        'An online catalog to display products with prices and photos; customers browse and order directly via WhatsApp.',
      plans: [{ id: 'standard', price: 120 }],
      features: [
        'Your products organized by category',
        'Every product with photos, price and details',
        'Customers order directly via WhatsApp',
        'Search bar to find products in seconds',
        'Update prices and products whenever you want',
      ],
      sampleSlug: 'modelo-5',
    },
    {
      id: 'store',
      name: 'Online Store',
      tagline: 'Sell online around the clock',
      description:
        'A full online store with shopping cart and product management for businesses that want to sell without middlemen.',
      plans: [{ id: 'standard', price: 150 }],
      features: [
        'Shopping cart so customers can buy on their own',
        'Keep track of your inventory and products',
        'Create deals and discount coupons',
        'Accept online payments',
        'Customer reviews and links to your social media',
      ],
      sampleSlug: 'modelo-4',
      featured: true,
    },
    {
      id: 'sales',
      name: 'Sales Systems',
      tagline: 'Control your sales operation',
      description:
        'An admin dashboard to manage sales, contracts, payments and sales reps with real-time metrics.',
      plans: [{ id: 'standard', price: 300 }],
      features: [
        'Track your contracts and orders in real time',
        "See how much you're owed and how much you've collected",
        'Log payments via Zelle, PayPal, Binance or cash',
        'Download sales reports by sales rep',
        'Use it from your phone, tablet or computer',
      ],
      sampleSlug: 'modelo-3',
    },
  ],
};

export function templateCategoriesFor(lang: ContentDocument['lang']): CategoriesCopy {
  return lang === 'en' ? en : es;
}
