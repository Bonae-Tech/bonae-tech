# Arquitectura — Apps estáticas de clientes

Reglas para toda app en `apps/clientes/<slug>/`.

## Stack

- **Astro 4** + **Tailwind 3** (`@astrojs/tailwind`)
- **Output:** `static`
- **Interactividad:** `<script is:inline>` (vanilla JS)
- **Idioma:** solo español, ruta `/`
- **Prohibido:** React, Vue, Svelte, islands con frameworks UI

## Estructura

```
apps/clientes/<slug>/
├── package.json              # name: "cliente-<slug>"
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── content/
│   ├── es.json               # copy del sitio (lang: "es")
│   └── settings.json         # siteUrl, whatsapp, redes, links legales
├── public/favicon.svg
└── src/
    ├── layouts/Layout.astro
    ├── pages/index.astro
    ├── components/
    ├── lib/content.ts
    └── styles/global.css
```

## Contenido

Editar directamente en repo o generar desde el spec SDD:

| Archivo | Contenido |
|---------|-----------|
| `content/es.json` | Textos del sitio |
| `content/settings.json` | WhatsApp, redes sociales, links legales |

### Loader (`src/lib/content.ts`)

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const contentRoot = join(import.meta.dirname, '../../content');

export const content = JSON.parse(readFileSync(join(contentRoot, 'es.json'), 'utf8'));
export const settings = JSON.parse(readFileSync(join(contentRoot, 'settings.json'), 'utf8'));

export function whatsappHref(message: string): string {
  return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
```

No usar `@bonae/content` en apps de cliente.

## Componentes

- Un `.astro` por sección
- Props tipadas en frontmatter; datos desde `content` / `settings`
- Tailwind utilities primero; clases compartidas en `global.css` (`@layer components`)

## Monorepo

Workspace registrado en root `package.json`: `"apps/clientes/*"`.

```bash
npm run dev --filter=cliente-<slug>
npm run build --filter=cliente-<slug>
```

## Deploy

Cloudflare Pages: `wrangler pages deploy dist --project-name <proyecto>`  
`site` en `astro.config.mjs` = URL de producción del cliente.
