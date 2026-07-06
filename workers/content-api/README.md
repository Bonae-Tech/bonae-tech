# Content API Worker

Cloudflare Worker: API de contenido autenticada (Cognito JWT) con borradores en ContentStore Durable Object y publicación atómica a git vía GitHub App.

**Modelo draft/publish:** [docs/architecture.md § Niveles de contenido](../../docs/architecture.md#niveles-de-contenido-draft-vs-publicado). **Mapa secciones ↔ API:** [admin-content-api-map.md](../../docs/admin-content-api-map.md).

## Rutas principales

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/content/state` | Bootstrap workspace |
| `PUT` | `/content/drafts/{es\|en\|settings}` | Persistir borrador en el DO |
| `POST` | `/content/publish` | Validar y commitear `published/` en GitHub |
| `GET` | `/content/publish/status` | Poll de estado de publish |
| `POST` | `/content/publish/callback` | Callback de CI |

## Auth

Bearer ID token de Cognito. JWKS + grupo `Administrators` en `src/auth/`.

## Configuración de producción

Workflow **Setup worker** — no `wrangler secret put` manual en prod.

1. Secretos `WORKER_GITHUB_*` en entorno **prod**
2. `PUBLISH_CALLBACK_SECRET` en **prod** → **Setup worker** `sync-secrets`
3. `CONTENT_API_URL` en **prod**
4. **Setup worker** `action: setup` en instalación inicial

Guía: [docs/workflows.md](../../docs/workflows.md)

## Desarrollo local

```bash
npm run dev:worker    # desde la raíz del repo
```

Secretos en `workers/content-api/.dev.vars` (gitignored).

## Tests

```bash
npm run worker:test
```

## Deploy

**Deploy worker** en push a `main` o `npm run deploy:worker`. Rotar secretos de GitHub App con **Setup worker** → `sync-secrets`.
