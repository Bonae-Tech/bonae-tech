# BONAE Tech — Architecture & Operations

This document describes the full system architecture, cloud infrastructure, CI/CD pipelines, and maintenance processes for the BONAE Tech platform.

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Workspaces](#2-workspaces)
3. [Cloud infrastructure](#3-cloud-infrastructure)
4. [Data flows](#4-data-flows)
5. [CI/CD pipelines](#5-cicd-pipelines)
6. [Maintenance processes](#6-maintenance-processes)

---

## 1. System overview

BONAE Tech is a **git-backed content platform**. All site copy lives as JSON files committed to this repository. There is no database — the git history is the content store.

```mermaid
flowchart TD
    subgraph Browser
        AdminSPA["Admin SPA\nReact + Vite"]
        MarketingSite["Marketing Site\nAstro · static HTML"]
    end

    subgraph AWS["AWS · sa-east-1"]
        Cognito["Cognito User Pool\nbonae-content-admins"]
        APIGW["API Gateway HTTP API\nbonae-content-api\nJWT authorizer"]
        Lambda["Lambda\nbonae-content-api"]
        SM["Secrets Manager\nbonae/github-app-content"]
        S3SPA["S3\nbonae-admin-spa"]
        CF["CloudFront\nadmin SPA · OAC"]
    end

    subgraph Cloudflare
        CFPages["Cloudflare Pages\nbonae-tech"]
    end

    subgraph GitHub["GitHub · mpiantella/bonae"]
        Drafts["content/drafts/"]
        Published["content/published/"]
        Actions["GitHub Actions"]
    end

    AdminSPA -->|"SRP auth"| Cognito
    Cognito -->|"ID token JWT"| AdminSPA
    AdminSPA -->|"Bearer JWT"| APIGW
    APIGW -->|"validate JWT"| Cognito
    APIGW -->|"AWS_PROXY"| Lambda
    Lambda -->|"GetSecretValue"| SM
    SM -.->|"GitHub App credentials"| Lambda
    Lambda -->|"commit JSON"| Drafts
    Lambda -->|"copy drafts → published"| Published
    Published -->|"push to main"| Actions
    Actions -->|"build + wrangler deploy"| CFPages
    CFPages --> MarketingSite
    S3SPA -->|"OAC signed request"| CF
    CF --> AdminSPA
```

### Key design decisions

- **No database.** Content is JSON in git. The git log is the audit trail.
- **No runtime server.** The marketing site is static HTML served from a CDN.
- **Minimal AWS.** Only the pieces needed for auth (Cognito) and the GitHub proxy (Lambda + API Gateway + Secrets Manager).
- **Invite-only admin.** No self-sign-up. Users are created via CLI and added to the `Administrators` Cognito group.
- **Locale parity enforced.** ES and EN documents must have matching structure at all times. The API rejects saves that break parity.

---

## 2. Workspaces

| Workspace | Path | Runtime | Deployed to |
|-----------|------|---------|-------------|
| Marketing site | `apps/static/` | Astro 4 + Tailwind | Cloudflare Pages |
| Content admin SPA | `apps/admin/` | React + Vite | S3 + CloudFront |
| Shared content schema | `packages/content/` | TypeScript → `dist/` | (not deployed — shared library) |
| Content API | `services/content-api/` | Node.js 20 Lambda | API Gateway + Lambda |
| Infrastructure | `infra/terraform/` | Terraform | AWS sa-east-1 |

### Build dependency order

`packages/content` **must be compiled before** anything that imports it. All workspaces import from `packages/content/dist/`.

```mermaid
graph LR
    PC["packages/content\nbuild first"]
    AS["apps/static"]
    AA["apps/admin"]
    SCA["services/content-api"]

    PC --> AS
    PC --> AA
    PC --> SCA
```

The root scripts (`admin:dev:mock`, `api:build`) handle this automatically. When running steps manually, always run `npm run content:build` first.

---

## 3. Cloud infrastructure

### 3.1 AWS resources (sa-east-1)

All resources are in the `sa-east-1` (São Paulo) region.

#### Bootstrap resources (one-time, local Terraform state)

| Resource | Name | Purpose |
|----------|------|---------|
| S3 bucket | `bonae-terraform-state-112066795953` | Remote state for main Terraform module |
| DynamoDB table | `bonae-terraform-locks` | State locking |
| IAM OIDC provider | `token.actions.githubusercontent.com` | Allows GitHub Actions to assume IAM roles |
| IAM role | `github-actions-bonae-deploy` | Role assumed by GitHub Actions for all deploys |

The bootstrap state file lives at `infra/terraform/bootstrap/terraform.tfstate` (local, gitignored). Keep it — it is needed to manage these resources.

#### Main module resources (managed by CI after first apply)

**Auth**

| Resource | Name | Purpose |
|----------|------|---------|
| Cognito User Pool | `bonae-content-admins` | Stores admin user accounts |
| User Pool Client | `bonae-content-admin-spa` | SPA auth client (SRP flow, no client secret) |
| User Group | `Administrators` | Users in this group may call the content API |

- `allow_admin_create_user_only = true` — no self-registration
- Users receive a temporary password by email and must set a permanent one on first login (FORCE_CHANGE_PASSWORD flow)

**Content API**

| Resource | Name | Purpose |
|----------|------|---------|
| API Gateway HTTP API | `bonae-content-api` | HTTPS endpoint; validates JWT against Cognito before forwarding |
| Lambda function | `bonae-content-api` | Handles all content routes; reads GitHub App credentials from Secrets Manager |
| Secrets Manager secret | `bonae/github-app-content` | GitHub App credentials (appId, installationId, privateKey) |
| Lambda execution role | auto-named | Allows Lambda to call Secrets Manager (`GetSecretValue`) |

The JWT authorizer on API Gateway enforces that the caller has a valid Cognito token. The Lambda additionally checks group membership — only `Administrators` group members may write.

**Admin SPA hosting**

| Resource | Name / type | Purpose |
|----------|------------|---------|
| S3 bucket | `bonae-admin-spa-{accountId}` | Hosts the built React app (private — no public access) |
| CloudFront distribution | — | Serves the SPA over HTTPS; handles SPA routing (404 → index.html) |
| CloudFront OAC | — | Signs requests to S3 so the bucket stays private |

**Terraform state (used by main module)**

| Resource | Name | Purpose |
|----------|------|---------|
| S3 bucket | `bonae-terraform-state-112066795953` | Created by bootstrap; used as backend |
| DynamoDB | `bonae-terraform-locks` | Created by bootstrap; used for locking |

### 3.2 Cloudflare

| Resource | Name | Purpose |
|----------|------|---------|
| Pages project | `bonae-tech` | Hosts the built Astro marketing site |
| Pages build config | `wrangler.toml` (repo root) | Tells Cloudflare how to build the site; ensures `packages/content` is compiled first |

The `wrangler.toml` at the repo root sets:
- **Build command:** `npm run content:build && npm run build`
- **Output directory:** `apps/static/dist`

This ensures Cloudflare's native build (used for PR preview deployments) compiles `packages/content` before trying to build the Astro site. Production deployments are triggered by `deploy-site.yml` via `wrangler pages deploy`.

### 3.3 GitHub configuration

**Secrets** (set by bootstrap Terraform, or manually):

| Secret | Set by | Used by |
|--------|--------|---------|
| `AWS_ROLE_ARN` | bootstrap Terraform | All AWS workflows |
| `AWS_REGION` | bootstrap Terraform | All AWS workflows |
| `CLOUDFLARE_API_TOKEN` | manual (environment secret on `prod`) | `deploy-site.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | manual (environment secret on `prod`) | `deploy-site.yml` |

**Repository variables** (set automatically after each `deploy-infra` run):

| Variable | Set by | Used by |
|----------|--------|---------|
| `COGNITO_USER_POOL_ID` | `deploy-infra.yml` | `deploy-admin.yml` build env |
| `COGNITO_CLIENT_ID` | `deploy-infra.yml` | `deploy-admin.yml` build env |
| `API_BASE_URL` | `deploy-infra.yml` | `deploy-admin.yml` build env |
| `ADMIN_S3_BUCKET` | `deploy-infra.yml` | `deploy-admin.yml` S3 sync |
| `ADMIN_CLOUDFRONT_ID` | `deploy-infra.yml` | `deploy-admin.yml` cache invalidation |
| `ADMIN_CLOUDFRONT_DOMAIN` | `deploy-infra.yml` | `deploy-infra.yml` CORS origin |

**Environments:**

| Environment | Branch restriction | Purpose |
|-------------|-------------------|---------|
| `infra-production` | `main` | Gates `terraform apply` — add required reviewers in GitHub Settings → Environments |

**GitHub App (`bonae-content-api`):**

- Permission: `Contents: Read & Write` on `mpiantella/bonae`
- Credentials stored in Secrets Manager `bonae/github-app-content`
- Used exclusively by the Lambda to commit content JSON to the repository
- Not created by Terraform — must be created manually via GitHub Settings → Developer settings → GitHub Apps

---

## 4. Data flows

### 4.1 Content editing (admin → draft)

```mermaid
sequenceDiagram
    actor Editor
    participant SPA as Admin SPA
    participant Cognito
    participant APIGW as API Gateway
    participant Lambda
    participant SM as Secrets Manager
    participant GH as GitHub

    Editor->>SPA: Enter credentials
    SPA->>Cognito: SRP authentication
    Cognito-->>SPA: ID token (JWT, 1h expiry)

    Editor->>SPA: Edit section, click Save
    SPA->>APIGW: PUT /content/drafts/{locale} · Bearer JWT
    APIGW->>Cognito: Validate JWT
    Cognito-->>APIGW: Valid
    APIGW->>Lambda: Forward request
    Lambda->>Lambda: Check Administrators group
    Lambda->>SM: GetSecretValue
    SM-->>Lambda: GitHub App credentials
    Lambda->>GH: Commit JSON to content/drafts/
    GH-->>Lambda: 201 Created
    Lambda-->>SPA: 200 OK
```

### 4.2 Publishing content (draft → published → site rebuild)

```mermaid
sequenceDiagram
    actor Editor
    participant SPA as Admin SPA
    participant APIGW as API Gateway
    participant Lambda
    participant GH as GitHub
    participant Actions as GitHub Actions
    participant CF as Cloudflare Pages

    Editor->>SPA: Click "Publish site"
    SPA->>APIGW: POST /content/publish · Bearer JWT
    APIGW->>Lambda: Forward (JWT already validated)
    Lambda->>Lambda: Validate ES/EN locale parity
    Lambda->>Lambda: Validate settings.json
    Lambda->>GH: Single commit · copy drafts/ → published/
    GH->>Actions: Push to main · triggers deploy-site.yml
    Actions->>Actions: Build packages/content
    Actions->>Actions: Validate published JSON
    Actions->>Actions: Build Astro site
    Actions->>CF: wrangler pages deploy dist
    CF-->>Editor: New static site live
```

### 4.3 Authentication — first login (invite flow)

New users are created via AWS CLI and receive a temporary password by email. Cognito returns `NEW_PASSWORD_REQUIRED` on first sign-in, which the admin SPA handles automatically.

```mermaid
flowchart TD
    A["Editor signs in\nemail + temporary password"] --> B["signIn()"]
    B --> C{Cognito response}
    C -->|"type: success"| D["Session established"]
    C -->|"type: newPasswordRequired"| E["SPA prompts for\npermanent password"]
    E --> F["completeChallenge(newPassword)"]
    F --> D
```

### 4.4 Admin SPA — request path

The admin SPA is a client-side React app. Vite inlines Cognito and API config at **build time** from environment variables injected by `deploy-admin.yml`.

```mermaid
flowchart LR
    Browser -->|"HTTPS"| CF["CloudFront\ndistribution"]
    CF -->|"OAC signed request"| S3["S3\nbonae-admin-spa"]
    S3 -->|"index.html\n404 → index.html"| CF
    CF -->|"index.html + assets"| Browser
    Browser -->|"Bearer JWT"| APIGW["API Gateway"]
```

---

## 5. CI/CD pipelines

All workflows live in `.github/workflows/`. Each targets a specific part of the monorepo via path filters — unrelated changes do not trigger unrelated workflows.

### Trigger overview

```mermaid
flowchart TD
    PR["Pull Request"] --> CI["ci.yml\nBuild all workspaces"]
    PR --> ContentCheck["content-pr-check.yml\nValidate published + draft JSON"]
    PR --> TFPlan["terraform-plan.yml\nPost Terraform plan as PR comment"]

    Main["Push to main"] --> DeploySite["deploy-site.yml\nBuild Astro · deploy to Cloudflare Pages"]
    Main --> DeployAdmin["deploy-admin.yml\nBuild SPA · S3 sync · CloudFront invalidation"]
    Main --> DeployInfra["deploy-infra.yml\nTerraform plan → approval → apply"]

    DeployInfra --> Gate["infra-production\nmanual approval"]
    Gate --> Apply["terraform apply\nStore outputs → GitHub repo variables"]
```

### Trigger matrix

| Workflow | Push to `main` | Pull request | Manual (`workflow_dispatch`) |
|----------|---------------|-------------|------|
| `ci.yml` | ✓ code paths | ✓ code paths | — |
| `content-pr-check.yml` | — | ✓ content paths | — |
| `deploy-site.yml` | ✓ site + content paths | — | ✓ |
| `deploy-admin.yml` | ✓ admin + content paths | — | ✓ |
| `terraform-plan.yml` | — | ✓ infra + api paths | — |
| `deploy-infra.yml` | ✓ infra + api paths | — | ✓ |

### `ci.yml` — Build verification

**Paths:** `apps/static/**`, `apps/admin/**`, `packages/content/**`, `services/content-api/**`

Builds all workspaces in dependency order and validates published content. Uses npm caching across all four `package-lock.json` files.

```mermaid
flowchart LR
    PC["packages/content\nnpm ci → build\nvalidate:published"]
    AS["apps/static\nnpm ci → build"]
    AA["apps/admin\nnpm ci → build"]
    SCA["services/content-api\nnpm ci → build"]

    PC --> AS --> AA --> SCA
```

### `content-pr-check.yml` — Content validation

**Paths:** `apps/static/content/**`, `packages/content/**`

Validates both published and draft JSON against the Zod schema and checks ES/EN locale parity.

```mermaid
flowchart LR
    A["packages/content\nnpm ci → build"] --> B["validate:published\ncontent/published/"]
    A --> C["validate\ncontent/drafts/"]
```

### `deploy-site.yml` — Marketing site deploy

**Paths:** `apps/static/**`, `packages/content/**`
**Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (both as **prod** environment secrets; the deploy job declares `environment: prod`)

```mermaid
flowchart LR
    A["packages/content\nnpm ci → build\nvalidate:published"] --> B["apps/static\nnpm ci → build"]
    B --> C["wrangler pages deploy dist\n--project-name bonae-tech"]
    C --> D["Cloudflare Pages\nbonae-tech"]
```

Uses a `concurrency` group (`deploy-site`) so concurrent runs queue rather than race.

### `deploy-admin.yml` — Admin SPA deploy

**Paths:** `apps/admin/**`, `packages/content/**`
**Secrets:** `AWS_ROLE_ARN`, `AWS_REGION`
**Variables:** `ADMIN_S3_BUCKET`, `ADMIN_CLOUDFRONT_ID`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `API_BASE_URL`

```mermaid
flowchart LR
    A["packages/content\nnpm ci → build"] --> B["apps/admin\nnpm ci → build\nwith VITE_* env vars"]
    B --> C["aws s3 sync dist/\nhashed assets: immutable\nindex.html: no-cache"]
    C --> D["CloudFront invalidation\n--paths '/*'"]
```

### `terraform-plan.yml` — Infrastructure plan on PRs

**Paths:** `infra/terraform/**`, `services/content-api/**`
**Secrets:** `AWS_ROLE_ARN`, `AWS_REGION`

Builds the Lambda first (so Terraform can hash the bundle), runs `terraform plan`, and posts the diff as a PR comment.

### `deploy-infra.yml` — Infrastructure apply

**Paths:** `infra/terraform/**`, `services/content-api/**`
**Secrets:** `AWS_ROLE_ARN`, `AWS_REGION`
**Permissions:** `id-token: write` (OIDC), `actions: write` (to set repo variables)

```mermaid
flowchart LR
    A["plan job\nBuild Lambda\nterraform init + plan\nUpload artifact"] --> Gate["infra-production\napproval"]
    Gate --> B["apply job\nDownload artifact\nterraform apply\nStore outputs → GitHub vars"]
```

The `apply` job uses `terraform_wrapper: false` so `terraform output -raw` works cleanly in the variable-store step.

---

## 6. Maintenance processes

### Content workflow (routine)

```mermaid
flowchart LR
    A["Sign in to admin SPA\nCognito Administrators group"] --> B["Edit section\nES and/or EN"]
    B --> C["Save draft\ncommits to content/drafts/"]
    C --> D{"Ready to publish?"}
    D -->|"no"| B
    D -->|"yes"| E["Publish site\nPOST /content/publish"]
    E --> F["drafts/ → published/\nsingle git commit"]
    F --> G["deploy-site.yml triggers\nAstro build + Cloudflare deploy"]
```

### Adding a Cognito user

```bash
POOL_ID=$(cd infra/terraform && terraform output -raw user_pool_id)
REGION=sa-east-1

aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --desired-delivery-mediums EMAIL \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --group-name Administrators \
  --region $REGION
```

The user receives a temporary password by email and is prompted to set a permanent one on first login.

### Rotating GitHub App credentials

The Lambda reads `bonae/github-app-content` on every invocation. Terraform's `ignore_changes = [secret_string]` ensures `terraform apply` never overwrites the value.

```bash
aws secretsmanager put-secret-value \
  --secret-id bonae/github-app-content \
  --secret-string '{"appId":"<ID>","installationId":"<ID>","privateKey":"<PEM>"}' \
  --region sa-east-1
```

No Lambda redeploy needed.

### Rotating the Cloudflare API token

1. Generate a new token in the Cloudflare dashboard with **Account → Cloudflare Pages → Edit** (and **Account → Account Settings → Read** if prompted)
2. Update `CLOUDFLARE_API_TOKEN` in GitHub Settings → Environments → **prod** → Environment secrets
3. The next `deploy-site.yml` run will use the new token

**Account ID (required for CI):** Wrangler needs `CLOUDFLARE_ACCOUNT_ID` when using API tokens in GitHub Actions — otherwise it calls `/memberships` to look up the account, which fails with authentication error 10000. Add `CLOUDFLARE_ACCOUNT_ID` as a **prod** environment secret (find it in the Cloudflare dashboard sidebar on any account page). Alternative: add **User → Memberships → Read** to a user-owned API token instead of setting the account ID.

### Applying infrastructure changes

```mermaid
flowchart LR
    A["Push to main\ninfra/ or services/"] --> B["plan job auto-runs"]
    B --> C["infra-production\napproval required"]
    C --> D["apply job\nterraform apply"]
    D --> E["Outputs stored\nas GitHub repo variables"]
```

To apply locally:

```bash
npm ci --prefix services/content-api && npm run api:build
cd infra/terraform
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Updating Terraform outputs after a manual apply

```bash
cd infra/terraform

gh variable set COGNITO_USER_POOL_ID    --body "$(terraform output -raw user_pool_id)"                      -R mpiantella/bonae
gh variable set COGNITO_CLIENT_ID       --body "$(terraform output -raw user_pool_client_id)"               -R mpiantella/bonae
gh variable set API_BASE_URL            --body "$(terraform output -raw api_url)"                           -R mpiantella/bonae
gh variable set ADMIN_CLOUDFRONT_DOMAIN --body "$(terraform output -raw admin_cloudfront_domain)"           -R mpiantella/bonae
gh variable set ADMIN_CLOUDFRONT_ID     --body "$(terraform output -raw admin_cloudfront_distribution_id)"  -R mpiantella/bonae
gh variable set ADMIN_S3_BUCKET         --body "$(terraform output -raw admin_s3_bucket_name)"              -R mpiantella/bonae
```

Then trigger `deploy-admin.yml` manually so the SPA rebuilds with the updated config.

### Validating content locally

```bash
# Validate published JSON (same check as prebuild hook)
npm run content:validate

# Validate draft JSON
npm --prefix packages/content run validate -- ../../apps/static/content drafts
```

### First-time bootstrap (new environment)

See [infra/README.md](../infra/README.md) for the full step-by-step guide. At a high level:

1. Run `infra/terraform/bootstrap/` once with personal AWS credentials
2. Create `infra/terraform/terraform.tfvars`
3. Build Lambda: `npm ci && npm run build` in `services/content-api/`
4. First apply of main module
5. Create GitHub App and populate Secrets Manager
6. Create first Cognito user
7. Trigger `deploy-admin` to push the SPA

After bootstrap, all subsequent infra changes are managed via CI.
