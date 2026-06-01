# Content admin workflow

Git-backed content editing for the BONAE static site with minimal AWS (Cognito + Lambda GitHub proxy).

## Architecture

- **Published content** (`apps/static/content/published/`) — read by the Astro site at build time
- **Draft content** (`apps/static/content/drafts/`) — edited via admin; not deployed until publish
- **Schema** (`packages/content`) — shared Zod validation for site, admin, and API
- **Admin SPA** (`apps/admin`) — React editor with Cognito login
- **Content API** (`services/content-api`) — Terraform stack (Cognito + HTTP API + Lambda); commits draft/publish to GitHub

## Editor workflow

1. Sign in to the admin app (Cognito user in `Administrators` group)
2. Choose locale (ES / EN) and section
3. **Save draft** — commits to `apps/static/content/drafts/` via GitHub App
4. **Publish site** — copies drafts → published in one git commit; push to `main` triggers Cloudflare deploy

## Local development

### Admin without AWS (recommended first)

Try the editor UI and save/publish flow locally. Changes write to `apps/static/content/` on disk (no Cognito, Lambda, or GitHub).

```bash
npm run admin:dev:mock
```

Open http://localhost:5173 — sign in with any email/password. After editing, run `npm run dev` to preview the marketing site (it reads `content/published/`).

### Static site

```bash
# Static site (reads published JSON only)
npm ci --prefix packages/content && npm run build --prefix packages/content
npm ci --prefix apps/static
npm run dev
```

### Admin with deployed AWS API

Requires deployed API + Cognito; copy `apps/admin/.env.example` → `.env` and fill in values.

```bash
npm ci --prefix apps/admin
npm run admin:dev
```

## AWS setup

Infrastructure is managed by Terraform in [`infra/terraform/`](../infra/terraform/) and deployed automatically via GitHub Actions. See [`services/content-api/README.md`](../services/content-api/README.md) for the full bootstrap guide.

One-time manual steps after first deploy:
1. Create a GitHub App (`bonae-content-writer`) with `Contents: Read & Write` on this repo
2. Update Secrets Manager `bonae/github-app-content` with `appId`, `installationId`, `privateKey`
3. Create Cognito users in the `Administrators` group (no self-sign-up)
4. Configure admin `.env` with API URL, User Pool ID, and Client ID from Terraform outputs (stored automatically as GitHub repository variables)

## Content validation

```bash
npm run content:validate
```

CI runs validation on published and draft JSON on every PR touching `apps/static/content/`.

## Important rules

- The static site **never** reads `content/drafts/` — only `content/published/`
- Keep ES and EN structure in sync (array lengths must match)
- Do not reintroduce Decap CMS, DynamoDB content stores, or parallel override pipelines
