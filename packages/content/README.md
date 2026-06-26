# @bonae/content

Shared Zod schema, types, and validators consumed by `apps/static`, `apps/admin`, and `workers/content-api`. Turborepo builds this package before any consumer via `dependsOn: ["^build"]`.

## Build

From the repo root:

```bash
npm ci
npm run content:build    # turbo run build --filter=@bonae/content
```

Or from this directory (workspace context):

```bash
npm run build    # tsc → dist/
```

## Key exports

| Export | Description |
|--------|-------------|
| `ContentDocument` | Zod-validated type for ES or EN site copy |
| `SiteSettings` | siteUrl, WhatsApp, social/legal links |
| `parseContentDocument` / `parseSiteSettings` | Parse + validate a raw object |
| `assertLocaleParity` | Throws if ES and EN documents have mismatched array lengths |
| `loadPublishedFromDir` | Used by Astro to load published content at build time |
| `checkLocaleParity` | Returns parity errors without throwing |

## Validate content

```bash
# From repo root
npm run content:validate

# Validate any content dir and tier
npm run validate -w @bonae/content -- apps/static/content drafts
npm run validate -w @bonae/content -- apps/static/content published
```

## Rules

- ES and EN documents must have **matching array lengths** at all mapped paths. `assertLocaleParity` is called on every draft save and again on publish.
- The `cli.js` entrypoint is used by `prebuild` and `predev` hooks in `apps/static` — if `dist/` does not exist those hooks will fail.
