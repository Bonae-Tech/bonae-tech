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

## First-time bootstrap (one-time manual steps)

1. Create Terraform state bucket + DynamoDB lock table in `sa-east-1`:
   ```bash
   aws s3 mb s3://bonae-terraform-state-112066795953 --region sa-east-1
   aws s3api put-bucket-versioning --bucket bonae-terraform-state-112066795953 --versioning-configuration Status=Enabled
   aws dynamodb create-table --table-name bonae-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST --region sa-east-1
   ```

2. Create AWS OIDC provider + IAM role for GitHub Actions (trust: `token.actions.githubusercontent.com`, repo `mpiantella/bonae`)

3. Create GitHub App (`bonae-content-writer`, `Contents: Read & Write` on this repo)

4. Add GitHub repository secrets: `AWS_ROLE_ARN`, `AWS_REGION`

5. Create GitHub environment `infra-production` with required reviewers (repo Settings → Environments)

After the first `deploy-infra` run completes:

6. Update Secrets Manager with GitHub App credentials:
   ```bash
   aws secretsmanager update-secret \
     --secret-id bonae/github-app-content \
     --secret-string '{"appId":"<ID>","installationId":"<ID>","privateKey":"<PEM>"}' \
     --region sa-east-1
   ```

7. Create Cognito admin user:
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
