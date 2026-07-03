# App de referencia: `apps/static`

El sitio BONAE Tech en [`apps/static/`](../../apps/static/) es la **implementación canónica**. Al crear una app en `apps/clientes/<slug>/`, replica esta estructura y adapta copy, colores y secciones según el spec del cliente.

## Árbol de directorios

```
apps/static/
├── astro.config.mjs          # Astro + Tailwind, output static, site URL
├── tailwind.config.mjs       # Tokens de color y tipografía
├── tsconfig.json
├── package.json              # name: "bonae-static"
├── content/
│   └── published/            # v1 clientes: solo es.json + settings.json
│       ├── es.json
│       ├── en.json           # BONAE only — no replicar en clientes v1
│       └── settings.json
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   ├── _headers
│   └── _redirects
└── src/
    ├── env.d.ts
    ├── layouts/
    │   └── Layout.astro      # Shell HTML, meta, slot, widgets globales
    ├── pages/
    │   └── index.astro       # Composición de secciones (ruta /)
    ├── components/           # Una sección ≈ un componente
    │   ├── Header.astro
    │   ├── Hero.astro
    │   ├── ValueProp.astro
    │   ├── KeyFigures.astro
    │   ├── About.astro
    │   ├── Plans.astro
    │   ├── Contact.astro
    │   ├── Footer.astro
    │   ├── WhatsAppFloat.astro
    │   └── CookieBanner.astro
    ├── lib/
    │   ├── content.ts        # Carga JSON en build time
    │   └── icons.ts
    └── styles/
        └── global.css        # @tailwind + @layer components
```

## Mapa sección → componente (BONAE)

| Sección | Componente | Patrón visual |
|---------|------------|---------------|
| Navegación | `Header.astro` | Sticky, links ancla, CTA |
| Hero | `Hero.astro` | Gradiente `dark-blue`, badge, headline, CTAs |
| Propuesta de valor | `ValueProp.astro` | Grid de cards con iconos |
| Cifras clave | `KeyFigures.astro` | Stats en fila/grid |
| Equipo / about | `About.astro` | Cards de miembros |
| Planes / servicios | `Plans.astro` | Cards de precios/servicios |
| Contacto | `Contact.astro` | Formulario visual + WhatsApp |
| Pie | `Footer.astro` | Links legales, redes |
| WhatsApp flotante | `WhatsAppFloat.astro` | Botón fijo inferior derecha |
| Cookies | `CookieBanner.astro` | Banner + `<script is:inline>` |

No toda app de cliente necesita todas las secciones. El spec del cliente define cuáles crear o adaptar.

## Configuración Astro

[`astro.config.mjs`](../../apps/static/astro.config.mjs):

- `integrations: [tailwind()]`
- `output: 'static'`
- `site`: URL de producción del cliente
- `compressHTML: true`

## Tokens Tailwind (BONAE — adaptar por cliente)

[`tailwind.config.mjs`](../../apps/static/tailwind.config.mjs):

| Token | Valor | Uso |
|-------|-------|-----|
| `terracotta` | `#FF6B35` | Acentos, CTAs secundarios |
| `dark-blue` | `#40575D` | Fondos hero, botones primarios |
| `mid-blue` / `light-blue` | — | Gradientes, bordes |
| `pacificblue` | `#0b4d5e` | Texto body |
| `cream` | `#d4d4b9` | Fondo página |
| `font-sans` | Inter Variable | Tipografía |

En apps de cliente: mantener la **estructura** del config; cambiar valores según branding del spec.

## Clases CSS reutilizables

[`global.css`](../../apps/static/src/styles/global.css) — copiar el patrón `@layer components`:

| Clase | Uso |
|-------|-----|
| `.btn-primary` | Botón principal |
| `.btn-whatsapp` | CTA WhatsApp (verde `#25D366`) |
| `.section-title` | Título de sección |
| `.section-subtitle` | Subtítulo centrado |
| `.card` | Tarjeta con borde y hover |

## Patrones de layout

- Contenedor: `max-w-6xl mx-auto px-4 sm:px-6`
- Secciones: `py-16 md:py-24` con fondo alterno (`bg-white` / `bg-cream`)
- Badge de sección: `inline-flex … rounded-full … text-sm font-medium`
- Hero oscuro: `bg-gradient-to-br from-dark-blue via-dark-blue-dark to-dark-blue text-white`

## Composición de página

[`index.astro`](../../apps/static/src/pages/index.astro) importa `Layout`, secciones y content:

```astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
// … más secciones
import { publishedEs, siteSettings, whatsappHrefFor } from '../lib/content';

const t = publishedEs;
const whatsappHref = whatsappHrefFor(t);
---

<Layout t={t} settings={siteSettings} whatsappHref={whatsappHref}>
  <Header t={t} />
  <main>
    <!-- secciones en orden -->
  </main>
  <Footer t={t} settings={siteSettings} whatsappHref={whatsappHref} />
</Layout>
```

Apps de cliente v1: una sola ruta `/`, solo español.

## Interactividad (sin SPA)

Patrón de [`CookieBanner.astro`](../../apps/static/src/components/CookieBanner.astro):

```astro
<script is:inline>
  (function () {
    // vanilla JS — localStorage, event listeners
  })();
</script>
```

- Usar `is:inline` para scripts que no necesitan bundling de Astro.
- No React, Vue, Svelte ni `@astrojs/react`.

## Contenido JSON

BONAE usa `@bonae/content` con `es.json`, `en.json` y validación de paridad.

**Apps de cliente v1:** JSON local simplificado, solo español:

```
content/published/es.json      ← copy del sitio (lang: "es")
content/published/settings.json ← siteUrl, whatsappNumber, socialLinks, legalLinks
```

Loader simplificado en `src/lib/content.ts` (leer archivos con `readFileSync` en frontmatter de Astro o módulo Node en build time). No depender de `@bonae/content` ni `en.json` en v1.

## Qué es específico de BONAE (no copiar literalmente)

- Copy, imágenes y dominio (`bonaetech.com`)
- `@bonae/content`, paridad ES/EN, hooks `predev`/`prebuild` con validación Zod
- Deploy project name `bonae-tech`
- Rutas `/en/` y hreflang EN en `Layout.astro`
- Integración con admin SPA y worker

## Qué sí copiar/adaptar

- Estructura de carpetas `src/`
- Patrón Layout + componentes por sección
- Tailwind + clases `@layer components`
- WhatsApp float, cookie banner (si aplica)
- `public/` assets mínimos (favicon, manifest)
