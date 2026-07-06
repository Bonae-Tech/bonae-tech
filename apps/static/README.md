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
