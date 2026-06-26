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

## Production setup

Use the **Setup worker** GitHub Actions workflow — do not run `wrangler secret put` manually in production.

1. Store GitHub App credentials as **prod** environment secrets: `WORKER_GITHUB_APP_ID`, `WORKER_GITHUB_INSTALLATION_ID`, `WORKER_GITHUB_PRIVATE_KEY`
2. Run **Setup worker** with `action: setup`

Full install guide: [docs/workflows.md](../../docs/workflows.md)

## Local development

```bash
npm run dev:worker    # from repo root
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
npm run worker:test    # from repo root
```

Security tests cover authorization policy and JWT header parsing (no network calls).

## Deploy (code only)

Day-to-day code deploys use **Deploy worker** (push to `main` or `npm run deploy:worker`). That workflow updates Worker code and Cognito vars but does **not** rotate GitHub App secrets — use **Setup worker** → `sync-secrets` for that.

```bash
npm run deploy:worker    # from repo root (requires Cloudflare credentials)
```
