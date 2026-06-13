# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo with four workspaces managed via npm scripts (no workspace hoisting — each package has its own `node_modules`):

```
apps/admin/        — Content admin SPA (React + Vite + Tailwind)
apps/static/       — Public marketing site (Astro + Tailwind)
services/content-api/ — Lambda handler (Node.js 20, esbuild bundle)
packages/content/  — Shared content schema, types, and validation (consumed by all three above)
infra/             — Terraform infrastructure (bootstrap + main module, sa-east-1)
```

## Commands

All commands are run from the repo root unless noted.

### Static site (`apps/static`)
```bash
npm run dev          # astro dev (validates published content first via predev hook)
npm run build        # astro build (validates published content first via prebuild hook)
```

### Admin SPA (`apps/admin`)
```bash
npm run admin:dev:mock   # mock mode: builds @bonae/content then starts Vite with VITE_USE_MOCK=true
npm run admin:dev        # real mode: requires .env in apps/admin/ with Cognito + API config
npm run admin:build      # tsc --noEmit + vite build
```

### Content package (`packages/content`)
```bash
npm run content:build    # tsc — must run before admin mock mode or content-api build
npm --prefix packages/content run test       # node --test (built files must exist first)
npm --prefix packages/content run validate   # validate a content dir via CLI
```

### Lambda (`services/content-api`)
```bash
npm run api:build    # builds @bonae/content then esbundles src/handler.ts → dist/handler.js
```

### Infrastructure (`infra/terraform/`)
```bash
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## Architecture

### Content data flow

All site copy lives as JSON files in `apps/static/content/`:
```
drafts/    es.json  en.json  settings.json   ← edited by admin
published/ es.json  en.json  settings.json   ← consumed by Astro site
```

**In production:** editing in the admin → API Gateway → Lambda → GitHub API (via GitHub App in Secrets Manager) → commits JSON to the repo → CI rebuilds the static site.

**In mock mode (`dev:mock`):** the Vite plugin `contentApiMockPlugin` (`apps/admin/vite.mockApi.ts`) intercepts all `/content/*` routes and reads/writes these files directly on disk.

### Shared schema (`packages/content`)

`packages/content` is the single source of truth for content types. It must be built (`npm run content:build`) before anything that imports it, since everything imports from `dist/`. Key exports:
- `ContentDocument` — Zod-validated type for all site copy (ES or EN)
- `SiteSettings` — siteUrl, whatsapp, social/legal links
- `assertLocaleParity` — ensures ES and EN documents have matching array lengths (enforced on every save and publish)
- `loadPublishedFromDir` — used by Astro to load content at build time

### Admin auth (`apps/admin/src/infrastructure/`)

`auth.ts` lazy-loads either `auth.mock.ts` (sessionStorage, no-op) or `auth.cognito.ts` (amazon-cognito-identity-js SRP flow) based on `VITE_USE_MOCK`. `signIn` returns a discriminated union: `{ type: 'success' }` or `{ type: 'newPasswordRequired', completeChallenge }`. The latter handles invite-only Cognito users who must set a permanent password on first login.

### Lambda handler (`services/content-api/src/handler.ts`)

Receives API Gateway v2 JWT-authorizer events. Requires callers to be in the `Administrators` Cognito group. All GitHub operations go through `@octokit/auth-app` (GitHub App credentials from Secrets Manager). Every save commits to `drafts/`; publish validates ES/EN parity + settings then copies `drafts/` → `published/` in a single commit.

### Infrastructure

Two Terraform modules applied in order:
1. `infra/terraform/bootstrap/` — S3 state bucket, DynamoDB lock table, GitHub OIDC provider, IAM deploy role, GitHub Actions secrets. **Local state, run once.**
2. `infra/terraform/` — Cognito, API Gateway + Lambda, Secrets Manager, S3 + CloudFront for admin SPA. Uses S3 backend from bootstrap.

The GitHub App credentials in Secrets Manager (`bonae/github-app-content`) are populated manually after first apply and protected by `ignore_changes = [secret_string]`.

## Key constraints

- **`packages/content` must be built before** running admin mock mode or building the Lambda. The `admin:dev:mock` and `api:build` scripts do this automatically.
- **Locale parity is enforced** on every draft save (ES and EN must have matching array lengths at all mapped paths) and again on publish. Errors surface as 400 responses from the API.
- **The static site validates published content** before `dev` and `build` via `predev`/`prebuild` hooks. If `apps/static/content/published/` is invalid, the site will not build.
- **Admin users are invite-only** (`allow_admin_create_user_only = true`). Create users via `aws cognito-idp admin-create-user` and add to the `Administrators` group.
