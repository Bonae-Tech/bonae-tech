# Content API Worker

Cloudflare Worker that proxies authenticated content operations to GitHub via a GitHub App.

## Routes

| Method | Path | Action |
|--------|------|--------|
| GET | `/content/drafts/{es\|en\|settings}` | Read draft JSON |
| PUT | `/content/drafts/{es\|en\|settings}` | Validate and commit draft |
| GET | `/content/published/{es\|en\|settings}` | Read published JSON |
| POST | `/content/publish` | Copy drafts → published |

## Auth

Every request requires a valid Cognito ID token (`Authorization: Bearer`). The Worker verifies JWTs via Cognito JWKS and checks group membership in `src/auth/authorize.ts`.

## Local development

```bash
make dev-worker
# or
cd workers/content-api && npx wrangler dev
```

Set secrets locally via `.dev.vars` (gitignored):

```
GITHUB_APP_ID=
GITHUB_INSTALLATION_ID=
GITHUB_PRIVATE_KEY=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

## Tests

```bash
make test-worker
```

Security tests cover authorization policy and JWT header parsing (no network calls).

## Deploy

```bash
make deploy-worker
```
