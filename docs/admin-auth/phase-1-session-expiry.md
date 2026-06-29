# Phase 1 — Session expiry UX and token refresh

## User stories

- As an admin, I see a clear message when my session ends and I must sign in again.
- As an admin, when my session is extended automatically, I am informed without being logged out.

## Scope

**In**

- Enable Cognito refresh-token auth in Terraform
- `refreshSession()` in auth layer; refresh-aware `getIdToken()`
- Replace silent 30s-early logout with refresh-first timer
- Login banner on forced expiry; dashboard banner on successful refresh
- One retry on API 401 after refresh
- Fix misleading `SetNewPasswordForm` copy (first-login only)

**Out**

- Password reset UI
- SES / DNS
- “Session expiring soon” warning

## Terraform

File: [`infra/terraform/cognito.tf`](../../infra/terraform/cognito.tf)

- Add `ALLOW_REFRESH_TOKEN_AUTH` to `explicit_auth_flows`
- Set `refresh_token_validity = 30` and `token_validity_units { refresh_token = "days" }`

## App changes

| File | Changes |
|------|---------|
| [`auth.cognito.ts`](../../apps/admin/src/infrastructure/auth.cognito.ts) | `refreshSession`, `onSessionRefreshed`, refresh-aware `getIdToken`, logout reason |
| [`auth.mock.ts`](../../apps/admin/src/infrastructure/auth.mock.ts) | Matching stubs |
| [`auth.ts`](../../apps/admin/src/infrastructure/auth.ts) | Facade exports |
| [`contentApi.ts`](../../apps/admin/src/infrastructure/contentApi.ts) | Refresh + retry on 401 |
| [`App.tsx`](../../apps/admin/src/App.tsx) | Timer logic, `logoutMessage`, session status |
| [`LoginForm.tsx`](../../apps/admin/src/ui/LoginForm.tsx) | Optional `infoMessage` prop |
| [`Dashboard.tsx`](../../apps/admin/src/ui/Dashboard.tsx) | Refresh banner prop |

## Acceptance criteria

- [ ] Manual sign-out → login screen with **no** expiry message
- [ ] Wait past ID token expiry (or mock) → refresh succeeds → dashboard shows “session extended” banner; editing still works
- [ ] Revoked/expired refresh token → login shows “Your session expired. Please sign in again.”
- [ ] API call with stale token → one silent refresh + retry succeeds
- [ ] Mock mode (`npm run admin:dev:mock`) behaves consistently

## Deploy and verify

1. `terraform apply` in `infra/terraform/` (cognito client update)
2. Deploy admin SPA (**Deploy admin** workflow or push under `apps/admin/`)
3. Sign in → leave tab open >1h → confirm refresh banner (not logout)
4. Sign out and sign in again — regression check
