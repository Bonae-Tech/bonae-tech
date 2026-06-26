# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo with npm workspaces and Turborepo. Install and run commands from the repo root unless noted.

```
apps/admin/           — Content admin SPA (React + Vite + Tailwind, Cloudflare Pages)
apps/static/          — Public marketing site (Astro + Tailwind, Cloudflare Pages)
workers/content-api/  — Content API Cloudflare Worker (Cognito JWT + GitHub App)
packages/content/     — Shared content schema, types, and validation (consumed by all above)
infra/                — Terraform infrastructure (bootstrap + Cognito-only module, sa-east-1)
```

## Commands

All commands are run from the repo root unless noted.

### Static site (`apps/static`)
```bash
npm run dev          # turbo: builds @bonae/content, validates published JSON, starts astro dev
npm run build        # turbo run build --filter=bonae-static
```

### Admin SPA (`apps/admin`)
```bash
npm run admin:dev:mock   # mock mode: turbo builds @bonae/content then starts Vite with VITE_USE_MOCK=true
npm run admin:dev        # real mode: requires .env in apps/admin/ with Cognito + API config
npm run admin:build      # tsc --noEmit + vite build
```

### Content package (`packages/content`)
```bash
npm run content:build    # turbo run build --filter=@bonae/content
npm run validate -w @bonae/content -- apps/static/content drafts   # validate a content dir via CLI
```

### Content API Worker (`workers/content-api`)
```bash
npm run worker:build    # turbo run build (typecheck; content built via ^build dep)
npm run worker:test     # vitest security tests
npm run worker:dev      # wrangler dev
```

### Infrastructure (`infra/terraform/`)
```bash
terraform plan
terraform apply
```

### Root orchestration (npm workspaces + Turborepo)
```bash
npm ci
npm run build       # content + static + admin + worker
npm run deploy:all  # worker then admin Pages
```

## Architecture

### Content data flow

All site copy lives as JSON files in `apps/static/content/`:
```
drafts/    es.json  en.json  settings.json   ← edited by admin
published/ es.json  en.json  settings.json   ← consumed by Astro site
```

**In production:** editing in the admin → Cloudflare Pages `/content/*` middleware → `bonae-content-api` Worker → GitHub API (via GitHub App secrets) → commits JSON to the repo → CI rebuilds the static site.

**In mock mode (`dev:mock`):** the Vite plugin `contentApiMockPlugin` (`apps/admin/vite.mockApi.ts`) intercepts all `/content/*` routes and reads/writes these files directly on disk.

### Shared schema (`packages/content`)

`packages/content` is the single source of truth for content types. It must be built (`npm run content:build`) before anything that imports it, since everything imports from `dist/`. Key exports:
- `ContentDocument` — Zod-validated type for all site copy (ES or EN)
- `SiteSettings` — siteUrl, whatsapp, social/legal links
- `assertLocaleParity` — ensures ES and EN documents have matching array lengths (enforced on every save and publish)
- `loadPublishedFromDir` — used by Astro to load content at build time

### Admin auth (`apps/admin/src/infrastructure/`)

`auth.ts` lazy-loads either `auth.mock.ts` (sessionStorage, no-op) or `auth.cognito.ts` (amazon-cognito-identity-js SRP flow) based on `VITE_USE_MOCK`. `signIn` returns a discriminated union: `{ type: 'success' }` or `{ type: 'newPasswordRequired', completeChallenge }`. The latter handles invite-only Cognito users who must set a permanent password on first login.

### Content API Worker (`workers/content-api/`)

Verifies Cognito JWTs via JWKS (`jose`). Requires callers to be in the `Administrators` Cognito group. All GitHub operations go through `@octokit/auth-app` (GitHub App credentials from Worker secrets). Every save commits to `drafts/`; publish validates ES/EN parity + settings then copies `drafts/` → `published/` in a single commit.

Admin Pages proxies `/content/*` to this Worker via `functions/content/_middleware.ts` and the `CONTENT_API` service binding in `apps/admin/wrangler.toml`.

### Infrastructure

Two Terraform modules applied in order:
1. `infra/terraform/bootstrap/` — S3 state bucket, DynamoDB lock table, GitHub OIDC provider, IAM deploy role, GitHub Actions secrets. **Local state, run once.**
2. `infra/terraform/` — Cognito user pool, SPA client, `Administrators` group. Uses S3 backend from bootstrap.

Admin hosting and the content API run on Cloudflare (Pages + Worker), not AWS.

## Key constraints

- **`packages/content` must be built before** running admin mock mode or building consumers. Turborepo `dependsOn: ["^build"]` handles this automatically; `admin:dev:mock` and `worker:build` also trigger content builds via Turbo.
- **Locale parity is enforced** on every draft save (ES and EN must have matching array lengths at all mapped paths) and again on publish. Errors surface as 400 responses from the API.
- **The static site validates published content** before `dev` and `build` via `predev`/`prebuild` hooks. If `apps/static/content/published/` is invalid, the site will not build.
- **Admin users are invite-only** (`allow_admin_create_user_only = true`). Create users via `aws cognito-idp admin-create-user` and add to the `Administrators` group.
