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
        'Arquitectura single-page de hasta 6 secciones con navegación por anclas',
        'SEO on-page: metaetiquetas, sitemap.xml e indexación en Google Search Console',
        'Diseño responsive mobile-first para smartphones, tablets y escritorio',
        'Integración con redes sociales y metadatos Open Graph',
        '1 formulario de contacto con validación y notificación por correo',
        'Botón flotante de WhatsApp con mensaje predefinido',
        'Soporte y mantenimiento técnico sin costo durante 15 días',
        'Hosting incluido con certificado SSL (HTTPS) y CDN',
        'Dominio incluido (sujeto a disponibilidad y condiciones)',
      ],
      excludedFeatures: ['No incluye diseño de identidad de marca (logo y manual de marca)'],
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
        'Arquitectura multipágina de hasta 6 vistas con rutas independientes',
        'Navegación global, footer con mapa del sitio y enlaces internos',
        'Módulo de blog/noticias con URL propia por artículo',
        'Internacionalización (i18n) ES/EN con rutas por idioma',
        'SEO técnico por página e integración con Google Analytics',
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
        'Arquitectura orientada a conversión (CRO) con un único objetivo',
        'CTAs estratégicos above the fold y a lo largo del recorrido',
        'Formulario de captación de leads con validación',
        'Bloques de prueba social: testimonios, logos y métricas',
        'Rendimiento optimizado (Core Web Vitals) para campañas de Ads',
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
        'Taxonomía de productos por categorías y subcategorías',
        'Fichas de producto con galería de imágenes, precio y variantes',
        'Pedidos vía WhatsApp con el detalle del producto precargado',
        'Búsqueda y filtrado por categoría y precio',
        'Gestión de contenido simplificada para actualizar el catálogo',
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
        'Carrito de compras persistente y flujo de checkout',
        'Gestión de inventario, control de stock y categorías',
        'Motor de promociones: cupones y ofertas con temporizador',
        'Integración con pasarelas de pago',
        'Reseñas de clientes e integración con redes sociales',
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
        'Seguimiento de contratos y pedidos por estado en tiempo real',
        'Dashboard financiero: deuda total, deuda vencida y cuentas por cobrar',
        'Conciliación de pagos multicanal (Zelle, PayPal, Binance, efectivo)',
        'Reportes exportables de ventas y cobranza por vendedor',
        'Interfaz web responsive accesible desde cualquier dispositivo',
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
        'Single-page architecture with up to 6 anchor-linked sections',
        'On-page SEO: meta tags, sitemap.xml and Google Search Console indexing',
        'Mobile-first responsive design for smartphones, tablets and desktop',
        'Social media integration and Open Graph metadata',
        '1 contact form with validation and email notification',
        'Floating WhatsApp button with a predefined message',
        'Free technical support and maintenance for 15 days',
        'Hosting included with SSL certificate (HTTPS) and CDN',
        'Domain included (subject to availability and conditions)',
      ],
      excludedFeatures: ['Brand identity design not included (logo and brand guidelines)'],
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
        'Multi-page architecture with up to 6 independently routed views',
        'Global navigation, sitemap footer and internal linking',
        'Blog/news module with a dedicated URL per article',
        'ES/EN internationalization (i18n) with per-language routes',
        'Per-page technical SEO and Google Analytics integration',
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
        'Conversion-focused (CRO) architecture with a single goal',
        'Strategic CTAs above the fold and throughout the flow',
        'Lead capture form with validation',
        'Social proof blocks: testimonials, logos and metrics',
        'Optimized performance (Core Web Vitals) for Ads campaigns',
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
        'Product taxonomy by category and subcategory',
        'Product pages with image gallery, price and variants',
        'WhatsApp ordering with product details prefilled',
        'Search and filtering by category and price',
        'Simplified content management to update the catalog',
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
        'Persistent shopping cart and checkout flow',
        'Inventory management, stock control and categories',
        'Promotions engine: coupons and countdown deals',
        'Payment gateway integration',
        'Customer reviews and social media integration',
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
        'Real-time contract and order tracking by status',
        'Financial dashboard: total debt, overdue debt and receivables',
        'Multichannel payment reconciliation (Zelle, PayPal, Binance, cash)',
        'Exportable sales and collections reports by sales rep',
        'Responsive web interface accessible from any device',
      ],
      sampleSlug: 'modelo-3',
    },
  ],
};

export function templateCategoriesFor(lang: ContentDocument['lang']): CategoriesCopy {
  return lang === 'en' ? en : es;
}
