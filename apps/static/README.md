# bonae-static

Sitio de marketing de BONAE Tech — Astro 4 + Tailwind CSS, desplegado en Cloudflare Pages.

## Requisitos previos

Instalar desde la raíz del repo (`npm ci`). Turborepo compila `@bonae/content` antes de este paquete cuando se usan scripts de la raíz.

## Desarrollo

```bash
npm run dev      # desde la raíz del repo — http://localhost:4321
```

Valida el JSON publicado antes de iniciar (hook `predev`). El sitio lee solo `content/published/` — los borradores nunca son visibles aquí.

## Build

```bash
npm run build    # desde la raíz del repo — valida JSON publicado, luego astro build → dist/
npm run preview  # previsualizar el build de producción localmente
```

## Estructura del contenido

```
content/
  published/       ← único nivel en git; leído por Astro en build
    es.json
    en.json
    settings.json
```

Los borradores no están en el repositorio. Ver [docs/architecture.md § Niveles de contenido](../../docs/architecture.md#niveles-de-contenido-draft-vs-publicado).

## Validar contenido publicado

```bash
npm run content:validate    # desde la raíz del repo
```

Es la misma verificación que ejecutan los hooks `predev` y `prebuild`. Si `published/` es inválido, el sitio no compilará.

## Caché y headers

Estrategia del sitio de marketing en Cloudflare Pages:

- **HTML** (`/*`): TTL corto (`max-age=60, must-revalidate`) para que un publish se vea pronto.
- **Assets hasheados** (`/_astro/*`): `immutable` a un año — Astro/Vite nombra JS/CSS/fuentes con hash de contenido.
- **`sw.js`**: `no-store` para forzar revalidación del service worker en cada visita.
- **Service worker**: navegaciones network-first; otros GET cache-first. El nombre de caché incluye el short SHA del commit (`inject-sw-build-hash.mjs` antes de `wrangler pages deploy`).

Configuración en el repo:

| Archivo | Rol |
|---------|-----|
| [`public/_headers`](./public/_headers) | Headers de seguridad + `Cache-Control` por ruta |
| [`public/sw.js`](./public/sw.js) | Service worker (placeholder `__BUILD_HASH__`) |
| [`scripts/inject-sw-build-hash.mjs`](./scripts/inject-sw-build-hash.mjs) | Sustituye el hash en `dist/sw.js` pre-deploy |

**Cloudflare Dashboard:** además de `_headers` (fuente de verdad en git), la configuración de Caching de la zona `bonaetech.com` se ajusta en:

https://dash.cloudflare.com/cd081958c621d4f8a9c7481da23e07f0/bonaetech.com/caching/configuration

Contexto de arquitectura: [docs/architecture.md § Caché del sitio de marketing](../../docs/architecture.md#caché-del-sitio-de-marketing).
