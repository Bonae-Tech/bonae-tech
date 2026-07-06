# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) para trabajar con el código de este repositorio.

## Estructura del repositorio

Este es un monorepo con npm workspaces y Turborepo. Instalar y ejecutar comandos desde la raíz del repo salvo que se indique lo contrario.

```
apps/admin/           — Admin de contenido SPA (React + Vite + Tailwind, Cloudflare Pages)
apps/static/          — Sitio de marketing público (Astro + Tailwind, Cloudflare Pages)
workers/content-api/  — API de contenido Cloudflare Worker (Cognito JWT + GitHub App)
packages/content/     — Esquema de contenido compartido, tipos y validación (consumido por todo lo anterior)
infra/                — Infraestructura Terraform (bootstrap + módulo solo Cognito, sa-east-1)
```

## Comandos

Todos los comandos se ejecutan desde la raíz del repo salvo que se indique lo contrario.

### Sitio estático (`apps/static`)
```bash
npm run dev          # turbo: compila @bonae/content, valida JSON publicado, inicia astro dev
npm run build        # turbo run build --filter=bonae-static
```

### Admin SPA (`apps/admin`)
```bash
npm run admin:dev:mock   # modo mock: turbo compila @bonae/content y luego inicia Vite con VITE_USE_MOCK=true
npm run admin:dev        # modo real: requiere .env en apps/admin/ con config de Cognito + API
npm run admin:build      # tsc --noEmit + vite build
```

### Paquete de contenido (`packages/content`)
```bash
npm run content:build    # turbo run build --filter=@bonae/content
npm run content:validate # turbo run validate:published --filter=@bonae/content
```

### Worker de API de contenido (`workers/content-api`)
```bash
npm run worker:build    # turbo run build (typecheck; content compilado vía dep ^build)
npm run worker:test     # tests de seguridad con vitest
npm run worker:dev      # wrangler dev
```

### Infraestructura (`infra/terraform/`)
```bash
terraform plan
terraform apply
```

### Orquestación raíz (npm workspaces + Turborepo)
```bash
npm ci
npm run build       # content + static + admin + worker
npm run deploy:all  # site, admin Pages y worker (turbo run deploy con tres filtros)
```

## Arquitectura

### Flujo de datos de contenido

**Publicado** — JSON en `apps/static/content/published/` (consumido por Astro en build). **Borradores** — no en git; ContentStore DO en producción o memoria en mock. Publish commitea solo `published/` vía GitHub App.

Detalle canónico: [docs/architecture.md § Niveles de contenido](docs/architecture.md#niveles-de-contenido-draft-vs-publicado).

**En producción:** admin → `/content/*` (Pages middleware) → Worker → DO (borradores) → publish atómico a `published/` → CI rebuild.

**En mock:** `vite.mockApi.ts` + `mockContentStore.ts` — borradores en memoria; publish escribe `published/` en disco.

### Esquema compartido (`packages/content`)

`packages/content` es la fuente única de verdad para los tipos de contenido. Debe compilarse (`npm run content:build`) antes que cualquier cosa que lo importe, ya que todo importa desde `dist/`. Exportaciones clave:
- `ContentDocument` — tipo validado con Zod para todo el copy del sitio (ES o EN)
- `SiteSettings` — siteUrl, whatsapp, enlaces sociales/legales
- `assertLocaleParity` — asegura que los documentos ES y EN tengan longitudes de arreglo coincidentes (aplicado en cada guardado y publicación)
- `loadPublishedFromDir` — usado por Astro para cargar contenido en tiempo de build

### Auth del admin (`apps/admin/src/infrastructure/`)

`auth.ts` carga de forma lazy `auth.mock.ts` (sessionStorage, no-op) o `auth.cognito.ts` (flujo SRP de amazon-cognito-identity-js) según `VITE_USE_MOCK`. `signIn` devuelve una unión discriminada: `{ type: 'success' }` o `{ type: 'newPasswordRequired', completeChallenge }`. Esta última maneja usuarios Cognito solo por invitación que deben establecer una contraseña permanente en el primer inicio de sesión.

### Worker de API de contenido (`workers/content-api/`)

Verifica JWTs de Cognito vía JWKS (`jose`). Grupo `Administrators` requerido. GitHub App para commits a `published/` únicamente. Borradores en ContentStore DO; publish valida paridad ES/EN + settings. Ver [docs/architecture.md](docs/architecture.md#niveles-de-contenido-draft-vs-publicado).

Admin Pages hace proxy de `/content/*` a este Worker vía `functions/content/_middleware.ts` y el service binding `CONTENT_API` en `apps/admin/wrangler.toml`.

### Infraestructura

Dos módulos Terraform aplicados en orden:
1. `infra/terraform/bootstrap/` — bucket de estado S3, tabla de bloqueo DynamoDB, proveedor GitHub OIDC, rol IAM de deploy, secretos de GitHub Actions. **Estado local, ejecutar una vez.**
2. `infra/terraform/` — user pool Cognito, cliente SPA, grupo `Administrators`. Usa backend S3 del bootstrap.

El hosting del admin y la API de contenido corren en Cloudflare (Pages + Worker), no en AWS.

## Restricciones clave

- **`packages/content` debe compilarse antes** de ejecutar el modo mock del admin o compilar consumidores. Turborepo `dependsOn: ["^build"]` lo maneja automáticamente; `admin:dev:mock` y `worker:build` también disparan builds de content vía Turbo.
- **La paridad de locale se valida al publicar** (cliente y servidor). Los autosaves de borrador son last-write-wins y pueden estar incompletos.
- **El sitio estático valida el contenido publicado** antes de `dev` y `build` vía hooks `predev`/`prebuild`. Si `apps/static/content/published/` es inválido, el sitio no compilará.
- **Los usuarios del admin son solo por invitación** (`allow_admin_create_user_only = true`). Crear usuarios vía `aws cognito-idp admin-create-user` y agregarlos al grupo `Administrators`.
