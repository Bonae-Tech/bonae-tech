import type { ContentDocument } from '@bonae/content';

export type TemplatePlanId = 'standard' | 'full';

export interface TemplatePlan {
  id: TemplatePlanId;
  price: number;
  /** Shown struck through next to `price` as an offer. */
  originalPrice?: number;
  /** Overrides the category bullets while this plan is selected. */
  features?: string[];
  excludedFeatures?: string[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  plans: TemplatePlan[];
  features: string[];
  excludedFeatures?: string[];
  /** Existing template linked by "Ver plantilla"; null leaves the button without a destination. */
  sampleSlug: string | null;
  /** With no sample, "Ver plantilla" opens the coming-soon modal instead of doing nothing. */
  comingSoon?: boolean;
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
        {
          id: 'full',
          price: 250,
          originalPrice: 270,
          features: [
            'Hasta 10 secciones para contar todo sobre tu negocio',
            'Botón de WhatsApp para atenderlos al instante',
            'Se ve perfecta en celulares, tablets y computadoras',
            'Aparece en Google para que tus clientes te encuentren fácil',
            'Enlaces a todas tus redes sociales',
            'Formulario para que tus clientes te escriban',
            'Tu ubicación en Google Maps para que lleguen sin perderse',
            'Creamos textos e imágenes acordes a la marca de tu empresa',
            'Páginas legales: cookies, términos y privacidad',
            '30 días de mantenimiento gratis',
            'Hosting incluido por 1 año (aplican condiciones)',
            'Dominio incluido por 1 año (aplican condiciones)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Hasta 6 secciones para contar todo sobre tu negocio',
        'Botón de WhatsApp para atenderlos al instante',
        'Se ve perfecta en celulares, tablets y computadoras',
        'Aparece en Google para que tus clientes te encuentren fácil',
        'Enlaces a todas tus redes sociales',
        'Formulario para que tus clientes te escriban',
        '15 días de mantenimiento gratis',
        'Hosting incluido por 1 año (aplican condiciones)',
        'Dominio incluido por 1 año (aplican condiciones)',
      ],
      excludedFeatures: ['No incluye diseño de marca personal (logo, colores)'],
      sampleSlug: null,
      comingSoon: true,
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'Un sitio corporativo completo',
      description:
        'Sitio con varias páginas, obtén presencia corporativa rápida y efectiva.',
      plans: [
        { id: 'standard', price: 320, originalPrice: 340 },
        {
          id: 'full',
          price: 480,
          originalPrice: 500,
          features: [
            'Hasta 5 páginas para mostrar todo lo que ofreces',
            'Botón de WhatsApp para atenderlos al instante',
            'Se ve perfecta en celulares, tablets y computadoras',
            'Aparece en Google para que tus clientes te encuentren fácil',
            'Enlaces a todas tus redes sociales',
            'Formulario para que tus clientes te escriban',
            'Tu ubicación en Google Maps para que lleguen sin perderse',
            'Creamos textos e imágenes acordes a la marca de tu empresa',
            'Páginas legales: cookies, términos y privacidad',
            '30 días de mantenimiento gratis',
            'Hosting incluido por 1 año (aplican condiciones)',
            'Dominio incluido por 1 año (aplican condiciones)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Hasta 3 páginas para mostrar todo lo que ofreces',
        'Botón de WhatsApp para atenderlos al instante',
        'Se ve perfecta en celulares, tablets y computadoras',
        'Aparece en Google para que tus clientes te encuentren fácil',
        'Enlaces a todas tus redes sociales',
        'Formulario para que tus clientes te escriban',
        '15 días de mantenimiento gratis',
        'Hosting incluido por 1 año (aplican condiciones)',
        'Dominio incluido por 1 año (aplican condiciones)',
      ],
      excludedFeatures: ['No incluye diseño de marca personal (logo, colores)'],
      sampleSlug: 'modelo-2',
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
      comingSoon: true,
    },
    {
      id: 'catalog',
      name: 'Catálogo Digital',
      tagline: 'Muestra tus productos sin complicaciones',
      description:
        'Catálogo en línea, muestra tus productos con presencia rápida y efectiva.',
      plans: [
        { id: 'standard', price: 199, originalPrice: 220 },
        {
          id: 'full',
          price: 340,
          originalPrice: 380,
          features: [
            'Hasta 50 productos para exhibir en tu catálogo',
            'Botón de WhatsApp para atenderlos al instante',
            'Se ve perfecta en celulares, tablets y computadoras',
            'Tus productos ordenados por categorías',
            'Cada producto con fotos, precio y detalles',
            'Aparece en Google para que tus clientes te encuentren fácil',
            'Enlaces a todas tus redes sociales',
            'Tus clientes te hacen pedidos directo por WhatsApp',
            'Buscador para encontrar productos en segundos',
            'Tu ubicación en Google Maps para que lleguen sin perderse',
            'Creamos textos e imágenes acordes a la marca de tu empresa',
            'Páginas legales: cookies, términos y privacidad',
            '30 días de mantenimiento gratis',
            'Hosting incluido por 1 año (aplican condiciones)',
            'Dominio incluido por 1 año (aplican condiciones)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Hasta 25 productos para exhibir en tu catálogo',
        'Botón de WhatsApp para atenderlos al instante',
        'Se ve perfecta en celulares, tablets y computadoras',
        'Tus productos ordenados por categorías',
        'Aparece en Google para que tus clientes te encuentren fácil',
        'Enlaces a todas tus redes sociales',
        'Tus clientes te hacen pedidos directo por WhatsApp',
        'Buscador para encontrar productos en segundos',
        '15 días de mantenimiento gratis',
        'Hosting incluido por 1 año (aplican condiciones)',
        'Dominio incluido por 1 año (aplican condiciones)',
      ],
      excludedFeatures: ['No incluye diseño de marca personal (logo, colores)'],
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
        {
          id: 'full',
          price: 250,
          originalPrice: 270,
          features: [
            'Up to 10 sections to tell your business story',
            'WhatsApp button to reply instantly',
            'Looks great on phones, tablets and computers',
            'Shows up on Google so customers find you easily',
            'Links to all your social media',
            'A form so customers can reach you',
            'Your location on Google Maps so customers find their way',
            'We create copy and images that match your brand',
            'Legal pages: cookies, terms and privacy',
            '30 days of free maintenance',
            'Hosting included for 1 year (conditions apply)',
            'Domain included for 1 year (conditions apply)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Up to 6 sections to tell your business story',
        'WhatsApp button to reply instantly',
        'Looks great on phones, tablets and computers',
        'Shows up on Google so customers find you easily',
        'Links to all your social media',
        'A form so customers can reach you',
        '15 days of free maintenance',
        'Hosting included for 1 year (conditions apply)',
        'Domain included for 1 year (conditions apply)',
      ],
      excludedFeatures: ['Personal brand design not included (logo, colors)'],
      sampleSlug: null,
      comingSoon: true,
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'A complete corporate website',
      description:
        'A multi-page site to get a fast, effective corporate online presence.',
      plans: [
        { id: 'standard', price: 320, originalPrice: 340 },
        {
          id: 'full',
          price: 480,
          originalPrice: 500,
          features: [
            'Up to 5 pages to show everything you offer',
            'WhatsApp button to reply instantly',
            'Looks great on phones, tablets and computers',
            'Shows up on Google so customers find you easily',
            'Links to all your social media',
            'A form so customers can reach you',
            'Your location on Google Maps so customers find their way',
            'We create copy and images that match your brand',
            'Legal pages: cookies, terms and privacy',
            '30 days of free maintenance',
            'Hosting included for 1 year (conditions apply)',
            'Domain included for 1 year (conditions apply)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Up to 3 pages to show everything you offer',
        'WhatsApp button to reply instantly',
        'Looks great on phones, tablets and computers',
        'Shows up on Google so customers find you easily',
        'Links to all your social media',
        'A form so customers can reach you',
        '15 days of free maintenance',
        'Hosting included for 1 year (conditions apply)',
        'Domain included for 1 year (conditions apply)',
      ],
      excludedFeatures: ['Personal brand design not included (logo, colors)'],
      sampleSlug: 'modelo-2',
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
      comingSoon: true,
    },
    {
      id: 'catalog',
      name: 'Digital Catalog',
      tagline: 'Showcase your products effortlessly',
      description:
        'An online catalog to showcase your products with a fast, effective presence.',
      plans: [
        { id: 'standard', price: 199, originalPrice: 220 },
        {
          id: 'full',
          price: 340,
          originalPrice: 380,
          features: [
            'Up to 50 products to showcase in your catalog',
            'WhatsApp button to reply instantly',
            'Looks great on phones, tablets and computers',
            'Your products organized by category',
            'Every product with photos, price and details',
            'Shows up on Google so customers find you easily',
            'Links to all your social media',
            'Customers order directly via WhatsApp',
            'Search bar to find products in seconds',
            'Your location on Google Maps so customers find their way',
            'We create copy and images that match your brand',
            'Legal pages: cookies, terms and privacy',
            '30 days of free maintenance',
            'Hosting included for 1 year (conditions apply)',
            'Domain included for 1 year (conditions apply)',
          ],
          excludedFeatures: [],
        },
      ],
      features: [
        'Up to 25 products to showcase in your catalog',
        'WhatsApp button to reply instantly',
        'Looks great on phones, tablets and computers',
        'Your products organized by category',
        'Shows up on Google so customers find you easily',
        'Links to all your social media',
        'Customers order directly via WhatsApp',
        'Search bar to find products in seconds',
        '15 days of free maintenance',
        'Hosting included for 1 year (conditions apply)',
        'Domain included for 1 year (conditions apply)',
      ],
      excludedFeatures: ['Personal brand design not included (logo, colors)'],
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
