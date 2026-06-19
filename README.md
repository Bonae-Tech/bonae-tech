# BONAE Tech

Git-backed content platform for the BONAE Tech marketing site. Editors update copy through a React admin; the content API runs on Cloudflare Workers; identity stays on AWS Cognito.

## Repository structure

```
apps/static/          — Marketing site (Astro + Tailwind, Cloudflare Pages bonae-tech)
apps/admin/           — Content admin SPA (React + Vite + Cognito, Cloudflare Pages bonae-admin)
workers/content-api/  — Content API (Cloudflare Worker, Cognito JWT + GitHub App)
packages/content/     — Shared Zod schema and validators (built before everything else)
infra/terraform/      — Cognito identity only (AWS sa-east-1)
infra/terraform/bootstrap/ — One-time state backend + GitHub OIDC setup
Makefile              — Root build/deploy orchestration (make build-all, make deploy-all)
```

Content lives in `apps/static/content/`:

```
drafts/    es.json  en.json  settings.json   ← saved by admin
published/ es.json  en.json  settings.json   ← read by Astro at build time
```

---

## Setup

### Prerequisites

- Node.js 20+
- npm
- Terraform ≥ 1.6 (for infrastructure work)
- AWS CLI (for infrastructure and user management)

### Build order

`packages/content` must be compiled before anything that imports it. Use `make build-all` from the repository root, or `npm run build:all`.

### Local development — static site

```bash
npm ci --prefix packages/content && npm run content:build
npm ci --prefix apps/static
npm run dev          # http://localhost:4321
```

The site reads only `apps/static/content/published/`. It will fail to start if published JSON is invalid.

### Local development — content admin (mock mode, no AWS required)

```bash
npm run admin:dev:mock   # http://localhost:5173
```

Sign in with any email/password. Saves write directly to `apps/static/content/` on disk. Use this to develop the editor UI without AWS credentials.

### Local development — content admin (real AWS)

Requires deployed infrastructure and a Cognito user in the `Administrators` group.

```bash
cp apps/admin/.env.example apps/admin/.env
# Fill in: VITE_API_BASE_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_AWS_REGION

npm ci --prefix apps/admin
npm run admin:dev        # http://localhost:5173
```

### First-time setup

1. Run `infra/terraform/bootstrap/` once — creates S3 state backend and GitHub OIDC role
2. Apply Cognito Terraform: `terraform apply` in `infra/terraform/` (or GitHub **Deploy cognito** workflow)
3. Set Worker secrets: `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_PRIVATE_KEY` via `wrangler secret put`
4. Deploy Worker, then admin Pages: `make deploy-all` (or GitHub **Deploy** workflow)
5. Create the first Cognito admin user (see below)

See **[infra/README.md](infra/README.md)** and **[docs/admin-cutover.md](docs/admin-cutover.md)** for full details.

---

## Maintenance

### Content workflow

Editors sign in to the admin SPA → edit sections in ES/EN → **Save draft** (commits to `drafts/`) → **Publish** (copies `drafts/` → `published/` in one commit, triggers Cloudflare rebuild).

See [apps/admin/README.md](apps/admin/README.md) for the full editor workflow and local dev instructions.

Rules enforced on every save:
- ES and EN documents must have matching array lengths at all mapped paths (locale parity)
- Published content is validated before every site build; an invalid `published/` will block the build

### Managing Cognito users

Users are invite-only (`allow_admin_create_user_only = true`). Create users via the AWS CLI — they receive a temporary password by email and must set a permanent one on first login.

```bash
POOL_ID=$(cd infra/terraform && terraform output -raw user_pool_id)
REGION=sa-east-1

# Create user (sends invite email)
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --desired-delivery-mediums EMAIL \
  --region $REGION

# Add to Administrators group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --group-name Administrators \
  --region $REGION
```

To disable or delete a user:

```bash
aws cognito-idp admin-disable-user --user-pool-id $POOL_ID --username editor@example.com --region $REGION
aws cognito-idp admin-delete-user  --user-pool-id $POOL_ID --username editor@example.com --region $REGION
```

### Infrastructure changes

Changes to `infra/terraform/cognito.tf` pushed to `main` trigger the `deploy-cognito` workflow. The apply job is gated by the `infra-production` GitHub environment.

### Rotating GitHub App credentials

```bash
cd workers/content-api
npx wrangler secret put GITHUB_PRIVATE_KEY
```

No Worker redeploy is required for secret updates to take effect on the next request.

### Validating content locally

```bash
npm run content:validate          # validate published JSON
npm --prefix packages/content run validate -- ../../apps/static/content drafts  # validate drafts
```

---

## CI/CD reference

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Push / PR | Builds all workspaces; validates published content |
| `deploy.yml` | Manual (`workflow_dispatch`) | Orchestrates site, admin, worker, or cognito deploys |
| `deploy-site.yml` | Push to `main` (static paths) | Builds marketing site, deploys to Cloudflare Pages |
| `deploy-admin.yml` | Push to `main` (admin paths) | Builds admin SPA, deploys to Cloudflare Pages |
| `deploy-worker.yml` | Push to `main` (worker paths) | Deploys content API Worker |
| `deploy-cognito.yml` | Push to `main` (cognito.tf paths) | Applies Cognito Terraform |
| `terraform-plan.yml` | PR touching `infra/terraform/**` | Posts Terraform plan as PR comment |

| Secret / Variable | Used by |
|-------------------|---------|
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Cloudflare deploy workflows |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | Admin SPA build, Worker deploy |
| `AWS_ROLE_ARN`, `AWS_REGION` | Cognito Terraform workflows |
| `GH_REPO_VARIABLES_TOKEN` | Storing Cognito outputs as repo variables |

---

## Command reference

| Command | Description |
|---------|-------------|
| `make build-all` | Build content, static site, admin SPA, and Worker |
| `make deploy-all` | Deploy Worker then admin Pages |
| `make deploy-site` | Build and deploy marketing site |
| `make deploy-worker` | Build and deploy content API Worker |
| `make deploy-admin` | Build and deploy admin SPA |
| `make dev-admin-mock` | Admin SPA in mock mode (no AWS) |
| `make dev-worker` | Local Worker dev server |
| `npm run build:all` | Alias for `make build-all` |
| `npm run content:validate` | Validate published JSON |

---

## License

Apache-2.0
