# bonae-static

BONAE Tech marketing site — Astro 4 + Tailwind CSS, deployed to Cloudflare Pages.

## Prerequisites

Build `packages/content` before running any commands here (the `prebuild`/`predev` hooks call the content validator, which requires `dist/cli.js` to exist):

```bash
npm ci --prefix ../../packages/content && npm run build --prefix ../../packages/content
```

## Dev

```bash
npm ci
npm run dev      # http://localhost:4321
```

Validates published JSON before starting (`predev` hook). The site reads only `content/published/` — drafts are never visible here.

## Build

```bash
npm run build    # validates published JSON, then astro build → dist/
npm run preview  # preview the production build locally
```

## Content structure

```
content/
  drafts/
    es.json          ← edited via admin SPA
    en.json
    settings.json
  published/
    es.json          ← read by Astro at build time
    en.json
    settings.json
```

**Only `content/published/` is read by the site.** Changes to drafts are not visible until published via the admin. Schema and validation live in `packages/content`.

## Validate published content

```bash
npm run content:validate
```

This is the same check run by the `predev` and `prebuild` hooks. If `published/` is invalid, the site will not build.

## Seeding content

```bash
npm run content:seed    # runs scripts/seed-content.ts via tsx
```
