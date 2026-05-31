# Content API (SAM)

Minimal AWS stack: Cognito + HTTP API + Lambda GitHub proxy.

## Prerequisites

- AWS SAM CLI
- GitHub App with `contents: write` on the repo
- Node.js 20+

## Deploy

```bash
cd services/content-api
npm ci
npm run build
sam build
sam deploy --guided \
  --parameter-overrides GitHubRepo=owner/bonae CorsOrigin=https://admin.example.com
```

Update Secrets Manager secret `bonae/github-app-content` with `appId`, `installationId`, and `privateKey`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/content/drafts/{es\|en\|settings}` | Read draft |
| PUT | `/content/drafts/{es\|en\|settings}` | Save draft |
| GET | `/content/published/{es\|en\|settings}` | Read published |
| POST | `/content/publish` | Promote drafts → published |

All routes require Cognito JWT with `Administrators` group.
