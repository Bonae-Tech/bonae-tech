# Content API Worker

Cloudflare Worker que hace proxy de operaciones de contenido autenticadas hacia GitHub vía una GitHub App.

## Rutas

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/content/drafts/{es\|en\|settings}` | Leer JSON de borrador |
| PUT | `/content/drafts/{es\|en\|settings}` | Validar y confirmar borrador |
| GET | `/content/published/{es\|en\|settings}` | Leer JSON publicado |
| POST | `/content/publish` | Copiar drafts → published |

## Auth

Cada solicitud requiere un token ID de Cognito válido (`Authorization: Bearer`). El Worker verifica JWTs vía Cognito JWKS y comprueba membresía de grupo en `src/auth/authorize.ts`.

## Configuración de producción

Usar el workflow de GitHub Actions **Setup worker** — no ejecutar `wrangler secret put` manualmente en producción.

1. Almacenar credenciales de GitHub App como secretos del entorno **prod**: `WORKER_GITHUB_APP_ID`, `WORKER_GITHUB_INSTALLATION_ID`, `WORKER_GITHUB_PRIVATE_KEY`
2. Generar `PUBLISH_CALLBACK_SECRET` (valor aleatorio) y añadirlo al entorno **prod**; ejecutar **Setup worker** con `action: sync-secrets` para copiarlo al Worker
3. Añadir `CONTENT_API_URL` al entorno **prod** (URL base del Worker, p. ej. `https://bonae-content-api.<account>.workers.dev`)
4. Ejecutar **Setup worker** con `action: setup` en instalación inicial

Guía completa de instalación: [docs/workflows.md](../../docs/workflows.md)

## Desarrollo local

```bash
npm run dev:worker    # desde la raíz del repo
```

Configurar secretos localmente vía `.dev.vars` (gitignored):

```
GITHUB_APP_ID=
GITHUB_INSTALLATION_ID=
GITHUB_PRIVATE_KEY=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

## Tests

```bash
npm run worker:test    # desde la raíz del repo
```

Los tests de seguridad cubren política de autorización y parseo de headers JWT (sin llamadas de red).

## Deploy (solo código)

Los deploys diarios de código usan **Deploy worker** (push a `main` o `npm run deploy:worker`). Ese workflow actualiza el código del Worker y las vars de Cognito pero **no** rota secretos de GitHub App — usar **Setup worker** → `sync-secrets` para eso.

```bash
npm run deploy:worker    # desde la raíz del repo (requiere credenciales de Cloudflare)
```
