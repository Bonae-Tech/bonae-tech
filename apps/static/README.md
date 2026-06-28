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
  drafts/
    es.json          ← editado vía admin SPA
    en.json
    settings.json
  published/
    es.json          ← leído por Astro en tiempo de build
    en.json
    settings.json
```

**Solo `content/published/` es leído por el sitio.** Los cambios en borradores no son visibles hasta publicarlos vía el admin. El esquema y la validación viven en `packages/content`.

## Validar contenido publicado

```bash
npm run content:validate    # desde la raíz del repo
```

Es la misma verificación que ejecutan los hooks `predev` y `prebuild`. Si `published/` es inválido, el sitio no compilará.

Para borradores: `npm run content:validate:drafts` desde la raíz del repo.
