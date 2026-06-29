# Phase 3 — SES production email (optional, deferred)

Depends on [Phase 2](./phase-2-password-reset.md). **No app code changes** — Cognito sends mail; the SPA from Phase 2 is unchanged.

## User stories

- As an admin, password-reset emails come from `@bonaetech.com` with reliable delivery.
- As an operator, reset emails are not capped by Cognito’s 50/day default.

## Scope

**In**

- SES domain identity + DKIM for `bonaetech.com` in `sa-east-1`
- SES identity policy allowing `cognito-idp.amazonaws.com` to send
- Cognito `email_configuration` with `EmailSendingAccount = DEVELOPER` (enabled via `cognito_use_ses_email`)
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
| `cognito_use_ses_email` | `false` | Flip to `true` after SES domain DNS is verified |

Outputs: domain verification TXT, DKIM CNAME records for Cloudflare.

### Two-step rollout

Cognito email switches from `COGNITO_DEFAULT` to SES only when `cognito_use_ses_email = true`. This avoids breaking invite/reset emails while DNS is pending.

1. **Apply** (default `cognito_use_ses_email = false`) — creates SES identity, DKIM, identity policy; Cognito keeps default sender
2. **Add DNS** from `terraform output` in Cloudflare
3. **Wait** until SES console shows domain **Verified**
4. Set `cognito_use_ses_email = true` in `infra/terraform/terraform.tfvars` and **apply again**
5. Request SES production access

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

1. `terraform apply` in `infra/terraform/` (SES resources only; Cognito still on default email)
2. Add DNS records from `terraform output ses_domain_verification_txt` and `ses_dkim_cname_records` in Cloudflare
3. Wait for SES domain verification; set `cognito_use_ses_email = true` in `terraform.tfvars` and apply again
4. Request SES production access
5. Test forgot-password flow end-to-end (no admin redeploy required)
