# content-api

Lambda handler for the BONAE content API — receives API Gateway v2 events, validates Cognito JWTs, and commits content JSON to GitHub via a GitHub App.

Infrastructure (Cognito, API Gateway, Lambda, Secrets Manager) is managed by Terraform in [`infra/terraform/`](../../infra/terraform/).

## Build

```bash
npm ci && npm run build
# Output: dist/handler.js
```

The build script compiles `packages/content` first, then esbundles `src/handler.ts`.

## Deploy

Handled automatically by CI on push to `main`:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `terraform-plan.yml` | PR touching `infra/terraform/**` or `services/content-api/**` | Posts Terraform plan as PR comment |
| `deploy-infra.yml` | Push to `main` (same paths) | Applies Terraform; stores outputs as GitHub repo variables |

For first-time bootstrap and manual deploy steps, see [infra/README.md](../../infra/README.md).

## API

All routes require a Cognito JWT (`Authorization: Bearer <id-token>`) from a user in the `Administrators` group.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/content/drafts/{es\|en\|settings}` | Read draft |
| `PUT` | `/content/drafts/{es\|en\|settings}` | Save draft (validates locale parity) |
| `GET` | `/content/published/{es\|en\|settings}` | Read published |
| `POST` | `/content/publish` | Validate + copy drafts → published in one commit |
