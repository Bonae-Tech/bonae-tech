# BONAE Tech

Git-backed content platform for the BONAE Tech marketing site. Editors update copy through a React admin backed by a minimal AWS stack; published content triggers an Astro static site rebuild on Cloudflare Pages.

## Repository structure

```
apps/static/          — Marketing site (Astro + Tailwind, Cloudflare Pages)
apps/admin/           — Content admin SPA (React + Vite + Cognito)
packages/content/     — Shared Zod schema and validators (built before everything else)
services/content-api/ — Lambda handler (Node.js 20, esbuild)
infra/terraform/      — Cognito, API Gateway, Lambda, S3 + CloudFront for admin
infra/terraform/bootstrap/ — One-time state backend + GitHub OIDC setup
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

`packages/content` must be compiled before anything that imports it (admin, static site, Lambda) because all packages import from `dist/`. The scripts below handle this automatically, but if you run steps manually: **always build content first.**

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

### First-time infrastructure bootstrap

See **[infra/README.md](infra/README.md)** for the full step-by-step guide. Summary:

1. Run `infra/terraform/bootstrap/` once locally — creates S3 state backend, DynamoDB lock table, GitHub OIDC provider, and IAM deploy role
2. Create `infra/terraform/terraform.tfvars` with repo, branch, and a placeholder `cors_origin`
3. Build the Lambda: `npm ci && npm run build` in `services/content-api/`
4. Apply the main module: `terraform apply -var-file=terraform.tfvars` in `infra/terraform/`
5. Populate Secrets Manager with GitHub App credentials (see infra/README.md step 6)
6. Create the first Cognito admin user (see below)
7. Trigger the `deploy-admin` workflow or deploy the admin SPA manually

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

Changes to `infra/terraform/**` or `services/content-api/**` pushed to `main` trigger the `deploy-infra` workflow automatically. The `apply` job is gated by the `infra-production` GitHub environment (requires manual approval — configure reviewers in GitHub Settings → Environments).

To plan locally:

```bash
cd infra/terraform
terraform plan -var-file=terraform.tfvars
```

### Rotating GitHub App credentials

The Lambda reads GitHub App credentials from Secrets Manager (`bonae/github-app-content`). Terraform never overwrites this value after initial creation (`ignore_changes = [secret_string]`).

To rotate:

```bash
aws secretsmanager put-secret-value \
  --secret-id bonae/github-app-content \
  --secret-string '{"appId":"<ID>","installationId":"<ID>","privateKey":"<PEM>"}' \
  --region sa-east-1
```

No infrastructure redeploy is needed — Lambda reads the secret on each invocation.

### Validating content locally

```bash
npm run content:validate          # validate published JSON
npm --prefix packages/content run validate -- ../../apps/static/content drafts  # validate drafts
```

---

## CI/CD reference

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Push / PR touching app or package code | Builds all workspaces in order; validates published content |
| `content-pr-check.yml` | PR touching `apps/static/content/**` or `packages/content/**` | Validates published + draft JSON |
| `deploy-site.yml` | Push to `main` touching `apps/static/**` or `packages/content/**` | Builds static site, deploys to Cloudflare Pages |
| `deploy-admin.yml` | Push to `main` touching `apps/admin/**` or `packages/content/**` | Builds admin SPA, syncs to S3, invalidates CloudFront |
| `terraform-plan.yml` | PR touching `infra/terraform/**` or `services/content-api/**` | Posts Terraform plan as PR comment |
| `deploy-infra.yml` | Push to `main` touching `infra/terraform/**` or `services/content-api/**` | Applies Terraform (gated by `infra-production` environment), stores outputs as GitHub vars |

All deploy workflows require these secrets/variables set in the GitHub repository:

| Secret / Variable | Set by | Used by |
|-------------------|--------|---------|
| `AWS_ROLE_ARN` | bootstrap Terraform | All AWS workflows |
| `AWS_REGION` | bootstrap Terraform | All AWS workflows |
| `CLOUDFLARE_API_TOKEN` | manual (environment secret on `prod`) | `deploy-site.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | manual (environment secret on `prod`) | `deploy-site.yml` |
| `COGNITO_USER_POOL_ID` | `deploy-infra.yml` output | `deploy-admin.yml` |
| `COGNITO_CLIENT_ID` | `deploy-infra.yml` output | `deploy-admin.yml` |
| `API_BASE_URL` | `deploy-infra.yml` output | `deploy-admin.yml` |
| `ADMIN_S3_BUCKET` | `deploy-infra.yml` output | `deploy-admin.yml` |
| `ADMIN_CLOUDFRONT_ID` | `deploy-infra.yml` output | `deploy-admin.yml` |
| `ADMIN_CLOUDFRONT_DOMAIN` | `deploy-infra.yml` output | `deploy-infra.yml` (CORS) |

---

## Command reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Astro dev server (validates published content first) |
| `npm run build` | Build marketing site → `apps/static/dist/` |
| `npm run preview` | Preview production build locally |
| `npm run content:build` | Compile `packages/content` (required before other builds) |
| `npm run content:validate` | Validate published JSON |
| `npm run admin:dev:mock` | Admin SPA in mock mode (no AWS, reads/writes disk) |
| `npm run admin:dev` | Admin SPA against real AWS (requires `.env`) |
| `npm run admin:build` | Build admin SPA → `apps/admin/dist/` |
| `npm run api:build` | Bundle Lambda → `services/content-api/dist/` |

---

## License

Apache-2.0
