# Admin cutover checklist

Use this checklist when switching production traffic from AWS (S3 + CloudFront + Lambda + API Gateway) to Cloudflare (Pages + Worker) while keeping Cognito on AWS.

## Pre-cutover

1. Deploy the content API Worker: `make deploy-worker` (or GitHub Actions **Deploy worker**).
2. Set Worker secrets in Cloudflare (one-time):
   ```bash
   cd workers/content-api
   npx wrangler secret put GITHUB_APP_ID
   npx wrangler secret put GITHUB_INSTALLATION_ID
   npx wrangler secret put GITHUB_PRIVATE_KEY
   ```
3. Set Worker vars (via deploy workflow or `wrangler deploy --var`):
   - `COGNITO_USER_POOL_ID`
   - `COGNITO_CLIENT_ID`
4. Deploy admin Pages: `make deploy-admin` (creates/updates `bonae-admin` project).
5. Clear or empty the `API_BASE_URL` repository variable so the SPA uses same-origin `/content/*`.
6. Verify staging:
   - Login via Cognito on the Pages preview URL
   - Save a draft and publish
   - Confirm `deploy-site.yml` runs after publish (git push to `main`)

## Cutover

1. Add custom domain `admin.<your-domain>` to Cloudflare Pages project `bonae-admin`.
2. Point DNS to Cloudflare Pages (CNAME or custom hostname).
3. Confirm `/content/*` routes to the Worker via the Pages service binding (`functions/content/_middleware.ts`).
4. Run parallel validation for up to one week (optional):
   - Compare Worker logs vs Lambda CloudWatch for save/publish actions
   - Confirm no 401/403 regressions for `Administrators` group members

## Post-cutover

1. Run **Deploy cognito** if token policy changes are pending (`id_token_validity = 1`, no refresh tokens).
2. Apply Terraform to destroy AWS compute/hosting (see `infra/README.md`).
3. Remove obsolete GitHub variables: `ADMIN_S3_BUCKET`, `ADMIN_CLOUDFRONT_ID`, `ADMIN_CLOUDFRONT_DOMAIN`.
4. Remove `API_BASE_URL` if no longer used (same-origin deployment).

## Rollback

If issues occur before AWS decommission:

1. Restore `API_BASE_URL` to the API Gateway URL.
2. Redeploy admin SPA with the cross-origin API URL.
3. Re-enable traffic to CloudFront/S3 if DNS was switched.

After Terraform destroy, rollback requires redeploying the removed AWS resources from git history.
