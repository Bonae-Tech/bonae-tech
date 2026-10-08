import type { ContentDocument } from '@bonae/content';

export interface TemplateCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  /** Shown struck through next to `price` as an offer. */
  originalPrice?: number;
  features: string[];
  excludedFeatures?: string[];
  /** Existing template shown by "Ver plantilla"; null opens the coming-soon modal. */
  sampleSlug: string | null;
  featured?: boolean;
}

interface CategoriesCopy {
  priceLabel: string;
  featuredLabel: string;
  viewTemplateLabel: string;
  categories: TemplateCategory[];
}

const es: CategoriesCopy = {
  priceLabel: 'Modelo Estándar',
  featuredLabel: 'Más solicitado',
  viewTemplateLabel: 'Ver plantilla',
  categories: [
    {
      id: 'onepage',
      name: 'OnePage',
      tagline: 'Todo tu negocio en una sola página',
      description:
        'Sitio de una sola página con navegación por secciones. Ideal para emprendedores y profesionales que necesitan presencia rápida.',
      price: 99,
      originalPrice: 120,
      features: [
        'Hasta 6 secciones',
        'SEO básico: que te encuentren rápido en Google',
        'Responsive: se ve bien en teléfonos, tablets y PC',
        'Conexión a redes sociales',
        '1 formulario de contacto',
        'Botón de WhatsApp',
        'Mantenimiento gratis por 15 días',
        'Incluye hosting',
        'Incluye dominio (aplican condiciones)',
      ],
      excludedFeatures: ['No incluye marca personal'],
      sampleSlug: 'modelo-2',
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'Un sitio corporativo completo',
      description:
        'Sitio con varias páginas independientes para empresas que necesitan presentar servicios, equipo y contenido en profundidad.',
      price: 180,
      features: [
        'Hasta 6 páginas internas',
        'Menú de navegación y pie de página completos',
        'Blog o sección de noticias',
        'Soporte multilenguaje (ES/EN)',
        'SEO por página y analítica integrada',
      ],
      sampleSlug: null,
    },
    {
      id: 'landing',
      name: 'LandingPage',
      tagline: 'Diseñada para convertir',
      description:
        'Página enfocada en una sola oferta o campaña, pensada para captar clientes potenciales desde anuncios y redes sociales.',
      price: 80,
      features: [
        'Estructura orientada a la conversión',
        'Llamadas a la acción destacadas',
        'Formulario de captura de clientes',
        'Testimonios y prueba social',
        'Carga ultrarrápida para campañas pagadas',
      ],
      sampleSlug: null,
    },
    {
      id: 'catalog',
      name: 'Catálogo Digital',
      tagline: 'Muestra tus productos sin complicaciones',
      description:
        'Catálogo en línea para exhibir productos con precios y fotos; tus clientes consultan y piden directamente por WhatsApp.',
      price: 120,
      features: [
        'Productos organizados por categorías',
        'Ficha de producto con fotos y precio',
        'Pedido directo por WhatsApp',
        'Buscador y filtros',
        'Fácil de actualizar',
      ],
      sampleSlug: 'modelo-5',
    },
    {
      id: 'store',
      name: 'Tienda Virtual',
      tagline: 'Vende en línea las 24 horas',
      description:
        'Tienda en línea completa con carrito de compras y gestión de productos para negocios que quieren vender sin intermediarios.',
      price: 150,
      features: [
        'Carrito de compras y checkout',
        'Gestión de inventario y categorías',
        'Ofertas con temporizador y cupones',
        'Integración con métodos de pago',
        'Reseñas de clientes y redes sociales',
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
      price: 300,
      features: [
        'Seguimiento de contratos y pedidos',
        'Resumen financiero y cuentas por cobrar',
        'Pagos multicanal (Zelle, PayPal, Binance, efectivo)',
        'Reportes descargables por vendedor',
        'Acceso desde cualquier dispositivo',
      ],
      sampleSlug: 'modelo-3',
    },
  ],
};

const en: CategoriesCopy = {
  priceLabel: 'Standard Model',
  featuredLabel: 'Most popular',
  viewTemplateLabel: 'View template',
  categories: [
    {
      id: 'onepage',
      name: 'OnePage',
      tagline: 'Your whole business on one page',
      description:
        'A single-page site with section navigation. Ideal for entrepreneurs and professionals who need a fast online presence.',
      price: 99,
      originalPrice: 120,
      features: [
        'Up to 6 sections',
        'Basic SEO: get found fast on Google',
        'Responsive: looks great on phones, tablets and PC',
        'Social media integration',
        '1 contact form',
        'WhatsApp button',
        'Free maintenance for 15 days',
        'Hosting included',
        'Domain included (conditions apply)',
      ],
      excludedFeatures: ['Personal branding not included'],
      sampleSlug: 'modelo-2',
    },
    {
      id: 'multipage',
      name: 'Multipage',
      tagline: 'A complete corporate website',
      description:
        'A site with several standalone pages for companies that need to present services, team and content in depth.',
      price: 180,
      features: [
        'Up to 6 internal pages',
        'Full navigation menu and footer',
        'Blog or news section',
        'Multilingual support (ES/EN)',
        'Per-page SEO and built-in analytics',
      ],
      sampleSlug: null,
    },
    {
      id: 'landing',
      name: 'LandingPage',
      tagline: 'Built to convert',
      description:
        'A page focused on a single offer or campaign, designed to capture leads from ads and social media.',
      price: 80,
      features: [
        'Conversion-oriented structure',
        'Prominent calls to action',
        'Lead capture form',
        'Testimonials and social proof',
        'Ultra-fast loading for paid campaigns',
      ],
      sampleSlug: null,
    },
    {
      id: 'catalog',
      name: 'Digital Catalog',
      tagline: 'Showcase your products effortlessly',
      description:
        'An online catalog to display products with prices and photos; customers browse and order directly via WhatsApp.',
      price: 120,
      features: [
        'Products organized by category',
        'Product page with photos and price',
        'Direct ordering via WhatsApp',
        'Search and filters',
        'Easy to update',
      ],
      sampleSlug: 'modelo-5',
    },
    {
      id: 'store',
      name: 'Online Store',
      tagline: 'Sell online around the clock',
      description:
        'A full online store with shopping cart and product management for businesses that want to sell without middlemen.',
      price: 150,
      features: [
        'Shopping cart and checkout',
        'Inventory and category management',
        'Countdown deals and coupons',
        'Payment method integration',
        'Customer reviews and social links',
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
      price: 300,
      features: [
        'Contract and order tracking',
        'Financial summary and receivables',
        'Multichannel payments (Zelle, PayPal, Binance, cash)',
        'Downloadable reports by sales rep',
        'Access from any device',
      ],
      sampleSlug: 'modelo-3',
    },
  ],
};

export function templateCategoriesFor(lang: ContentDocument['lang']): CategoriesCopy {
  return lang === 'en' ? en : es;
}
