# Phase 2 — Password reset (Cognito default email)

Depends on [Phase 1](./phase-1-session-expiry.md).

## User stories

- As an admin who forgot my password, I can request a reset code by email and set a new password securely.
- As an admin, I am not told whether an email exists in the system (enumeration protection).

## Scope

**In**

- `account_recovery_setting { verified_email }` in Terraform
- `requestPasswordReset` / `confirmPasswordReset` in auth layer
- `ForgotPasswordForm` + `ResetPasswordForm` UI
- “Forgot password?” link on login (hidden in mock mode)
- Mock flow with fixed code `123456`
- Client-side password policy validation (12+ chars, upper, lower, number)

**Out**

- SES, DNS, branded sender
- Logged-in “change password” (future)

## Terraform

File: [`infra/terraform/cognito.tf`](../../infra/terraform/cognito.tf)

```hcl
account_recovery_setting {
  recovery_mechanism {
    name     = "verified_email"
    priority = 1
  }
}
```

No `email_configuration` change — stays on Cognito default (`COGNITO_DEFAULT`, 50 emails/day per AWS account).

## App changes

| File | Changes |
|------|---------|
| Auth layer | `requestPasswordReset`, `confirmPasswordReset` |
| `ForgotPasswordForm.tsx` | New — enter email |
| `ResetPasswordForm.tsx` | New — code + new password |
| `App.tsx` | Auth view: `login \| forgot \| reset \| newPassword` |
| `LoginForm.tsx` | Forgot link + success message after reset |

## Limits (Cognito default email)

- Sender: `no-reply@verificationemail.com` (or similar Cognito default)
- Quota: **50 emails/day per AWS account** (shared across pools using default email)
- Sufficient for a small invite-only admin team

## Acceptance criteria

- [ ] Forgot password → generic “If an account exists, a code was sent” (same for unknown email)
- [ ] Valid code + policy-compliant password → success → login with confirmation message
- [ ] Invalid/expired code → clear error
- [ ] First-login invite flow (`NEW_PASSWORD_REQUIRED`) still works
- [ ] Mock mode: reset with code `123456` works

## Deploy and verify

1. `terraform apply` in `infra/terraform/`
2. Deploy admin SPA
3. Request reset for a real admin email → receive Cognito default email → complete reset → sign in
4. Confirm invite-only first-login flow unchanged
