# App de referencia: `apps/static`

[`apps/static/`](../../apps/static/) es el sitio BONAE Tech — **referencia de estructura y patrones** al crear apps en `apps/clientes/<slug>/`.

## Estructura a replicar (adaptada)

```
apps/clientes/<slug>/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── content/
│   ├── es.json
│   └── settings.json
├── public/
└── src/
    ├── layouts/Layout.astro
    ├── pages/index.astro
    ├── components/       # una sección ≈ un componente
    ├── lib/content.ts
    └── styles/global.css
```

## Componentes de referencia (BONAE)

| Sección | Archivo en `apps/static` |
|---------|--------------------------|
| Navegación | `Header.astro` |
| Hero | `Hero.astro` |
| Propuesta de valor | `ValueProp.astro` |
| Cifras | `KeyFigures.astro` |
| Equipo | `About.astro` |
| Servicios / planes | `Plans.astro` |
| Contacto | `Contact.astro` |
| Pie | `Footer.astro` |
| WhatsApp flotante | `WhatsAppFloat.astro` |
| Cookies | `CookieBanner.astro` |

El spec del cliente define qué secciones incluir.

## Patrones visuales

Copiar de [`tailwind.config.mjs`](../../apps/static/tailwind.config.mjs) y [`global.css`](../../apps/static/src/styles/global.css):

- Clases: `.btn-primary`, `.btn-whatsapp`, `.section-title`, `.section-subtitle`, `.card`
- Layout: `max-w-6xl mx-auto px-4 sm:px-6`
- Hero: gradiente oscuro + badge + CTAs

Adaptar colores al branding del cliente en `tailwind.config.mjs`.

## Composición de página

Ver [`index.astro`](../../apps/static/src/pages/index.astro): `Layout` → `Header` → secciones en `<main>` → `Footer`.

Apps de cliente: una ruta `/`, solo español, sin `/en/`.

## Interactividad

Patrón en [`CookieBanner.astro`](../../apps/static/src/components/CookieBanner.astro):

```astro
<script is:inline>
  (function () { /* vanilla JS */ })();
</script>
```

## Qué NO copiar de BONAE

- Copy, dominio e imágenes de BONAE
- `@bonae/content`, validación Zod, paridad ES/EN
- Rutas `/en/` ni hreflang
- Admin SPA ni worker de contenido

## Qué SÍ copiar

- Organización `src/` (layouts, pages, components, lib, styles)
- Patrón Layout + componentes por sección
- Tailwind + `@layer components`
- Carga de JSON en build time vía `src/lib/content.ts`
