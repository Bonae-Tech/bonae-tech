# Cloudflare Pages caching (repeatable)

Canonical HTTP cache + service-worker policy for BONAE Cloudflare Pages sites in this monorepo. Apply the same checklist to every new Pages app (`apps/static`, `apps/admin`, future sites).

Architecture context: [architecture.md § Caché de sitios Pages](./architecture.md#caché-de-sitios-pages).

## Policy (spec)

| Path | `Cache-Control` | Why |
|------|-----------------|-----|
| `/*` (HTML / shell) | `public, max-age=60, must-revalidate` | Deploys show up quickly |
| Hashed build assets | `public, max-age=31536000, immutable` | Content-hashed filenames are safe to cache forever |
| `/sw.js` | `no-store` | Service worker must revalidate every visit |
| Optional: `/manifest.webmanifest` | `public, max-age=60, must-revalidate` | Align with HTML when present |

**Hashed asset path by bundler**

| Stack | Immutable path in `_headers` |
|-------|------------------------------|
| Astro | `/_astro/*` |
| Vite (default) | `/assets/*` |

Confirm the output folder after `npm run build` (`dist/_astro` vs `dist/assets`) before copying the template.

**Service worker**

- Navigations: **network-first** (offline fallback to `/`).
- Other same-origin GETs: **cache-first**.
- Never intercept or cache API / authenticated paths (admin: `/content/*`).
- Cache name: `<site-prefix>-__BUILD_HASH__`. Replace `__BUILD_HASH__` with the short git SHA **after** build, **before** `wrangler pages deploy`.

**Cloudflare Dashboard:** zone-level Caching (Browser Cache TTL, etc.) on `bonaetech.com` complements `_headers`; per-route headers in git remain the source of truth.

https://dash.cloudflare.com/cd081958c621d4f8a9c7481da23e07f0/bonaetech.com/caching/configuration

## Checklist — add to a new Pages site

Replace `apps/<site>` with the app directory (e.g. `apps/admin`).

### 1. `public/_headers`

Create `apps/<site>/public/_headers` (copied into `dist/` on build):

```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=60, must-revalidate

/<HASHED_ASSETS>/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: no-store
```

- Set `/<HASHED_ASSETS>/*` to `/_astro/*` (Astro) or `/assets/*` (Vite).
- Add `/manifest.webmanifest` with the HTML TTL if the site ships a manifest.

Reference implementations: [`apps/static/public/_headers`](../apps/static/public/_headers), [`apps/admin/public/_headers`](../apps/admin/public/_headers).

### 2. `public/sw.js`

Create `apps/<site>/public/sw.js` with:

- `CACHE_NAME = '<site-prefix>-__BUILD_HASH__'` (unique prefix per project, e.g. `bonae-tech`, `bonae-admin`).
- Precache only the shell routes you need (`/` for an SPA; marketing may add `/en/`, favicon, manifest).
- Skip non-GET and any API prefix (see admin for `/content/`).

Reference: [`apps/static/public/sw.js`](../apps/static/public/sw.js), [`apps/admin/public/sw.js`](../apps/admin/public/sw.js).

### 3. Register the service worker

In the HTML shell (Astro layout or Vite `index.html`):

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>
```

### 4. Inject build hash before deploy

Shared script (repo root):

```bash
node scripts/inject-sw-build-hash.mjs <path-to-dist>
```

Example: `node scripts/inject-sw-build-hash.mjs apps/admin/dist`

- Resolves hash from `BUILD_HASH` (CI: `github.sha`) or `git rev-parse --short HEAD`.
- Replaces `__BUILD_HASH__` in `dist/sw.js`.
- Fails if `dist/sw.js` is missing or the placeholder is gone.

Wire it in:

1. **Local deploy script** in `apps/<site>/package.json`, e.g.  
   `"deploy": "node ../../scripts/inject-sw-build-hash.mjs dist && wrangler pages deploy dist --project-name <pages-project>"`
2. **GitHub Actions** deploy workflow — after build, before `wrangler pages deploy`:

```yaml
- name: Inject SW build hash
  working-directory: apps/<site>
  env:
    BUILD_HASH: ${{ github.sha }}
  run: node ../../scripts/inject-sw-build-hash.mjs dist
```

### 5. Verify

1. `npm run build` in the app (or turbo filter).
2. Confirm `dist/_headers` and `dist/sw.js` exist; `sw.js` still contains `__BUILD_HASH__` until inject.
3. Run the inject script; `sw.js` should contain the short SHA.
4. After deploy: DevTools → Network → document/`sw.js` show the expected `Cache-Control`; Application → Service Workers shows the new cache name.

## Sites in this repo

| Site | Pages project | Hashed assets | SW prefix | Deploy workflow |
|------|---------------|---------------|-----------|-----------------|
| Marketing | `bonae-tech` | `/_astro/*` | `bonae-tech` | [deploy-site.yml](../.github/workflows/deploy-site.yml) |
| Admin | `bonae-admin` | `/assets/*` | `bonae-admin` | [deploy-admin.yml](../.github/workflows/deploy-admin.yml) |
