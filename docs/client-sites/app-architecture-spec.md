# Arquitectura — Apps estáticas de clientes

Reglas obligatorias para toda app en `apps/clientes/<slug>/`.

## Stack

| Capa | Tecnología | Prohibido |
|------|------------|-----------|
| Framework | Astro 4 | React, Vue, Svelte como UI |
| CSS | Tailwind 3 via `@astrojs/tailwind` | CSS-in-JS, Bootstrap, DaisyUI |
| Output | `output: 'static'` | SSR, adapters server |
| Interactividad | `<script is:inline>` vanilla JS | SPA frameworks, Astro islands con UI libs |
| Idioma | Solo español | Rutas `/en/`, copy bilingüe |

## Estructura mínima de una app nueva

```
apps/clientes/<slug>/
├── package.json                 # "name": "cliente-<slug>"
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── content/published/
│   ├── es.json
│   └── settings.json
├── public/
│   └── favicon.svg
└── src/
    ├── layouts/Layout.astro
    ├── pages/index.astro
    ├── components/              # según spec del cliente
    ├── lib/content.ts
    └── styles/global.css
```

## package.json

```json
{
  "name": "cliente-<slug>",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "deploy": "wrangler pages deploy dist --project-name <cloudflare-project>"
  },
  "dependencies": {
    "@astrojs/tailwind": "^6.0.2",
    "@fontsource-variable/inter": "^5.2.8",
    "astro": "^4.16.19",
    "tailwindcss": "^3.4.19"
  },
  "devDependencies": {
    "wrangler": "^3.99.0"
  }
}
```

No agregar `@bonae/content` en v1.

## Contenido (español, local)

| Archivo | Contenido |
|---------|-----------|
| `content/published/es.json` | Copy del sitio. Campo `"lang": "es"` obligatorio. Estructura definida en el spec del cliente. |
| `content/published/settings.json` | `siteUrl`, `whatsappNumber`, `socialLinks`, `legalLinks` |

Editado en repo o generado desde el spec SDD. Sin admin en v1.

### Loader (`src/lib/content.ts`)

Patrón v1 — lectura directa en build time:

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const contentRoot = join(import.meta.dirname, '../../content/published');

export const content = JSON.parse(readFileSync(join(contentRoot, 'es.json'), 'utf8'));
export const settings = JSON.parse(readFileSync(join(contentRoot, 'settings.json'), 'utf8'));

export function whatsappHref(message: string): string {
  return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
```

Tipar props de componentes con interfaces locales o `typeof content` según complejidad.

## Componentes Astro

- Un archivo `.astro` por sección lógica.
- Frontmatter (`---`) para imports, props tipadas, lógica de build.
- Template: HTML + clases Tailwind.
- Props reciben datos de `content` / `settings`; no hardcodear copy salvo prototipo temporal.

## Estilos

1. Utilities Tailwind en el markup (preferido).
2. Clases compartidas en `global.css` bajo `@layer components` (`.btn-primary`, `.card`, etc.).
3. Tokens de color en `tailwind.config.mjs` — adaptar al branding del cliente.

## Layout

- `<html lang="es">`
- Meta: description, theme-color, Open Graph básico.
- Sin `hreflang` EN ni rutas alternativas.
- Slot para contenido de página.
- Widgets globales opcionales: WhatsApp float, cookie banner.

## Monorepo

Registrar en root [`package.json`](../../package.json):

```json
"workspaces": [
  "apps/*",
  "apps/clientes/*",
  "packages/*",
  "workers/*"
]
```

Build desde la raíz:

```bash
npm run build --filter=cliente-<slug>
npm run dev --filter=cliente-<slug>
```

## Deploy

- Cloudflare Pages vía `wrangler pages deploy`
- Project name único por cliente (definido en spec del cliente)
- `site` en `astro.config.mjs` = URL de producción

## Validación antes de merge

```bash
npm run build --filter=cliente-<slug>
```

Debe compilar sin errores. Preview local: `npm run preview -w cliente-<slug>`.

## Futuro (documentado, no implementar en v1)

- Admin centralizado con drafts/publish por app
- Schema compartido o por cliente en `packages/content`
- Posible reutilización de `@bonae/content` cuando el admin soporte multi-app
