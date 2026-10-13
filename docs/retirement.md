# Retirement: CMS (admin + content-api worker + Cognito)

**Status: RETIRING. Do not deploy, re-enable, or `terraform apply` any of the below.**

The marketing site (`apps/static`, Pages project `bonae-tech`) and its contact form
(`apps/static/functions/api/contact.ts`) are NOT retiring and do not depend on these.

## Already done (this repo)
- Workflows disabled (`if: false` on every job, push/PR triggers removed):
  `deploy-worker`, `setup-worker`, `deploy-admin`, `setup-admin`, `deploy-cognito`, `terraform-plan`.
  (`bootstrap` and `deploy` only call these, so their CMS targets now skip.)
- `RETIRED.md` markers added in `workers/content-api/`, `apps/admin/`, `infra/terraform/`.

## TODO (manual, in order)
1. Cloudflare: delete Pages project `bonae-admin` (or remove its `CONTENT_API` service binding first).
2. Cloudflare: delete workers `bonae-content-api` and `bonae-content-api-staging`
   (also deletes Durable Object `ContentStore` drafts - export first if needed), its secrets and workers.dev hostname.
3. AWS: `terraform destroy` in `infra/terraform/` (Cognito pool, client, `Administrators` group).
   Check the shared `bootstrap/` state bucket/OIDC role before touching it.
4. GitHub: delete `prod` env secrets/vars `CONTENT_API_URL`, `PUBLISH_CALLBACK_SECRET`,
   `WORKER_GITHUB_APP_ID`, `WORKER_GITHUB_INSTALLATION_ID`, `WORKER_GITHUB_PRIVATE_KEY`; uninstall/delete the worker's GitHub App.
5. Repo cleanup (after 1-4): delete `workers/content-api/`, `apps/admin/`, `infra/terraform/*` (non-bootstrap),
   the disabled workflows, `worker:*`/`deploy:*` scripts in root `package.json`, `workers/*` workspace entry,
   the "Report deploy status to content API" step in `deploy-site.yml`, and refresh `CLAUDE.md`/`docs/`.
