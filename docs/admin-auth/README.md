# Admin authentication — phased delivery

Specs for session expiry UX, token refresh, password reset, and optional SES email for the content admin SPA ([`apps/admin/`](../../apps/admin/)).

Platform context: [architecture.md](../architecture.md) · CI/CD: [workflows.md](../workflows.md)

## Phases

```mermaid
flowchart LR
  P1[Phase 1\nSession UX + refresh]
  P2[Phase 2\nPassword reset]
  P3[Phase 3\nSES email]
  P1 --> P2
  P2 --> P3
  P3 -.->|optional| P3
```

| Phase | Spec | Terraform | Admin SPA | Deploy alone? |
|-------|------|-----------|-----------|---------------|
| 1 — Session expiry & refresh | [phase-1-session-expiry.md](./phase-1-session-expiry.md) | `cognito.tf` — refresh flow | Yes | Yes |
| 2 — Password reset | [phase-2-password-reset.md](./phase-2-password-reset.md) | `cognito.tf` — recovery settings | Yes | Yes (Cognito default email) |
| 3 — SES email (optional) | [phase-3-ses-email.md](./phase-3-ses-email.md) | `ses.tf` + DNS | No | Yes (infra only) |

**Delivery rhythm:** one branch → one PR → deploy → update checklist below → next phase.

## Status

| Phase | Status | Deployed | Notes |
|-------|--------|----------|-------|
| 1 — Session expiry & refresh | code complete | infra yes, admin pending | Terraform applied 2026-06-29; run **Deploy admin** with `CLOUDFLARE_API_TOKEN` |
| 2 — Password reset | code complete | infra yes, admin pending | shipped with Phase 1 in same admin build |
| 3 — SES email (optional) | deferred | — | spec only; see [phase-3-ses-email.md](./phase-3-ses-email.md) |

**Next step:** deploy admin SPA (`npm run deploy:admin` locally with Cloudflare token, or **Deploy admin** GitHub workflow on merge).

## Deploy commands

From repo root unless noted.

| Phase | Steps |
|-------|--------|
| 1 & 2 | `terraform apply` in `infra/terraform/` → merge PR → **Deploy admin** (or push under `apps/admin/`) |
| 3 | `terraform apply` → add DNS in Cloudflare → SES production access request |

**Local test:** `npm run admin:dev:mock` for UI; `npm run admin:dev` with `.env` for Cognito after Phase 1.
