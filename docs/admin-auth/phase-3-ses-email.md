# Phase 3 — SES production email (optional, deferred)

Depends on [Phase 2](./phase-2-password-reset.md). **No app code changes** — Cognito sends mail; the SPA from Phase 2 is unchanged.

## User stories

- As an admin, password-reset emails come from `@bonaetech.com` with reliable delivery.
- As an operator, reset emails are not capped by Cognito’s 50/day default.

## Scope

**In**

- SES domain identity + DKIM for `bonaetech.com` in `sa-east-1`
- IAM role for Cognito → SES
- Cognito `email_configuration` with `EmailSendingAccount = DEVELOPER`
- Terraform outputs for DNS records (TXT + 3 DKIM CNAMEs)
- Runbook for Cloudflare DNS + SES production access request

**Out**

- Admin SPA changes
- Dedicated IP, Mail Manager, marketing email

## Planned Terraform

New [`infra/terraform/ses.tf`](../../infra/terraform/ses.tf) and variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `ses_domain` | `bonaetech.com` | Domain to verify |
| `cognito_from_email` | `noreply@bonaetech.com` | FROM address for Cognito |

Outputs: domain verification TXT, DKIM CNAME records for Cloudflare.

## DNS (Cloudflare)

Additive records only — **does not affect** site routing (`bonaetech.com` A/CNAME for Pages).

| Record | Purpose |
|--------|---------|
| 1× TXT `_amazonses.bonaetech.com` | Domain ownership |
| 3× CNAME `*._domainkey.bonaetech.com` | DKIM signing |

If business email already uses the domain (e.g. Google Workspace), **merge SPF** — do not replace:

```text
v=spf1 include:_spf.google.com include:amazonses.com ~all
```

Optional DMARC TXT helps SES production approval.

## SES sandbox → production

Until production access is granted:

- Send only to **verified recipient** addresses in SES
- Limit: 200 emails / 24h, 1 msg/sec

After domain verification, request production access in the SES console (~24–48h). Suggested description:

> Transactional password reset for invite-only admin content pool; fewer than 10 users; no marketing mail.

## Acceptance criteria

- [ ] DNS records added; SES domain status = verified
- [ ] Production access granted
- [ ] Forgot-password email arrives from `noreply@bonaetech.com` (or chosen address)
- [ ] Phase 2 UI still works unchanged

## Cost

~$0 at admin scale. SES free tier (3,000 message charges/month × 12 months) starts on **first SES use** — deferring this phase preserves that clock until needed.

## Deploy and verify

1. `terraform apply` in `infra/terraform/`
2. Add DNS records from Terraform outputs in Cloudflare
3. Request SES production access
4. Test forgot-password flow end-to-end (no admin redeploy required)
