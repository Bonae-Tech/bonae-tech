# Content API

Minimal AWS stack: Cognito + HTTP API + Lambda GitHub proxy. Infrastructure managed by Terraform in [`infra/terraform/`](../../infra/terraform/).

## Prerequisites

- Node.js 20+
- GitHub App with `Contents: Read & Write` on this repo
- AWS credentials with permissions to deploy the Terraform stack

## Local build

```bash
npm ci && npm run build
# Output: dist/handler.js + dist/package.json
```

## Deploy (automated via GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `terraform-plan.yml` | Pull request touching this path | Posts Terraform plan diff as PR comment |
| `deploy-infra.yml` | Push to `main` touching this path | Applies Terraform, stores outputs as GitHub vars |
| `deploy-admin.yml` | Push to `main` (`apps/admin/**`) | Builds + uploads admin SPA to S3, invalidates CloudFront |

## First-time bootstrap

All AWS prerequisites (S3 state bucket, DynamoDB lock table, OIDC provider, IAM role) and GitHub configuration (secrets, environment) are declared in [`infra/terraform/bootstrap/`](../../infra/terraform/bootstrap/). Run it once locally with your own AWS credentials — after that everything is managed by CI.

```bash
cd infra/terraform/bootstrap

# AWS credentials must be set in your shell (aws configure, SSO, etc.)
export GITHUB_TOKEN=<pat-with-repo-secrets-environments-scope>

terraform init
terraform apply
```

This creates and stores in Terraform local state:
- S3 bucket + DynamoDB table for remote state
- GitHub OIDC provider + IAM deploy role
- `AWS_ROLE_ARN` and `AWS_REGION` repository secrets
- `infra-production` deployment environment (add required reviewers in GitHub Settings → Environments)

**One step that cannot be automated** — GitHub does not expose an API to create GitHub Apps:

3. Create GitHub App (`bonae-content-writer`, `Contents: Read & Write` on this repo) via GitHub Settings → Developer settings → GitHub Apps

After the first `deploy-infra` run completes:

4. Update Secrets Manager with GitHub App credentials:
   ```bash
   aws secretsmanager update-secret \
     --secret-id bonae/github-app-content \
     --secret-string '{"appId":"<ID>","installationId":"<ID>","privateKey":"<PEM>"}' \
     --region sa-east-1
   ```

5. Create Cognito admin user:
   ```bash
   aws cognito-idp admin-create-user --user-pool-id <UserPoolId> \
     --username editor@bonaetech.com --region sa-east-1
   aws cognito-idp admin-add-user-to-group --user-pool-id <UserPoolId> \
     --username editor@bonaetech.com --group-name Administrators --region sa-east-1
   aws cognito-idp admin-set-user-password --user-pool-id <UserPoolId> \
     --username editor@bonaetech.com --password "<SecurePassword>" --permanent --region sa-east-1
   ```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/content/drafts/{es\|en\|settings}` | Read draft |
| PUT | `/content/drafts/{es\|en\|settings}` | Save draft |
| GET | `/content/published/{es\|en\|settings}` | Read published |
| POST | `/content/publish` | Promote drafts → published |

All routes require a Cognito JWT with the `Administrators` group.
