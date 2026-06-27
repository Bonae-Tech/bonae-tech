# BONAE Tech

Plataforma de contenido respaldada por Git para el sitio de marketing de BONAE Tech. Los editores actualizan los textos mediante un admin en React; la API de contenido corre en Cloudflare Workers; la identidad permanece en AWS Cognito.

## Estructura del repositorio

```
apps/static/          — Sitio de marketing (Astro + Tailwind, Cloudflare Pages bonae-tech)
apps/admin/           — Admin de contenido SPA (React + Vite + Cognito, Cloudflare Pages bonae-admin)
workers/content-api/  — API de contenido (Cloudflare Worker, Cognito JWT + GitHub App)
packages/content/     — Esquema Zod compartido y validadores (se compila antes que todo lo demás)
infra/terraform/      — Solo identidad Cognito (AWS sa-east-1)
infra/terraform/bootstrap/ — Configuración única de backend de estado + GitHub OIDC
package.json + turbo.json — Orquestación raíz (npm workspaces + Turborepo)
```

El contenido vive en `apps/static/content/`:

```
drafts/    es.json  en.json  settings.json   ← guardado por el admin
published/ es.json  en.json  settings.json   ← leído por Astro en tiempo de build
```

---

## Configuración

### Requisitos previos

- Node.js 20+
- npm
- Terraform ≥ 1.6 (para trabajo de infraestructura)
- AWS CLI (para infraestructura y gestión de usuarios)

### Orden de compilación

`packages/content` debe compilarse antes que cualquier cosa que lo importe. Desde la raíz del repositorio:

```bash
npm ci
npm run build        # o npm run build:all
```

Turborepo ejecuta `@bonae/content` primero vía `dependsOn: ["^build"]`, luego compila apps y workers en paralelo.

### Desarrollo local — sitio estático

```bash
npm ci
npm run dev          # http://localhost:4321
```

El sitio lee solo `apps/static/content/published/`. No arrancará si el JSON publicado es inválido.

### Desarrollo local — admin de contenido (modo mock, sin AWS)

```bash
npm run admin:dev:mock   # http://localhost:5173
```

Inicia sesión con cualquier email/contraseña. Los guardados escriben directamente en `apps/static/content/` en disco. Úsalo para desarrollar la UI del editor sin credenciales de AWS.

### Desarrollo local — admin de contenido (AWS real)

Requiere infraestructura desplegada y un usuario Cognito en el grupo `Administrators`.

```bash
cp apps/admin/.env.example apps/admin/.env
# Completar: VITE_API_BASE_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_AWS_REGION

npm ci
npm run admin:dev        # http://localhost:5173
```

### Configuración inicial

1. Ejecutar `infra/terraform/bootstrap/` una vez — crea el backend de estado S3 y el rol GitHub OIDC
2. Agregar credenciales de Cloudflare y GitHub App a los secretos del entorno **prod** — ver [docs/workflows.md](docs/workflows.md#instalación-única)
3. Ejecutar **Bootstrap (one-time install)** con `step: full` — Cognito → Worker → admin Pages → sitio
4. Crear el primer usuario admin de Cognito (ver abajo)

Documentación de la plataforma: [docs/architecture.md](docs/architecture.md) · [docs/workflows.md](docs/workflows.md) · [infra/README.md](infra/README.md)

---

## Mantenimiento

### Flujo de contenido

Los editores inician sesión en el admin SPA → editan secciones en ES/EN → **Save draft** (confirma en `drafts/`) → **Publish** (copia `drafts/` → `published/` en un commit, dispara rebuild de Cloudflare).

Ver [apps/admin/README.md](apps/admin/README.md) para el flujo completo del editor e instrucciones de desarrollo local.

Reglas aplicadas en cada guardado:
- Los documentos ES y EN deben tener longitudes de arreglo coincidentes en todas las rutas mapeadas (paridad de locale)
- El contenido publicado se valida antes de cada build del sitio; un `published/` inválido bloqueará el build

### Gestión de usuarios Cognito

Los usuarios son solo por invitación (`allow_admin_create_user_only = true`). Crear usuarios vía AWS CLI — reciben una contraseña temporal por email y deben establecer una permanente en el primer inicio de sesión.

```bash
POOL_ID=$(cd infra/terraform && terraform output -raw user_pool_id)
REGION=sa-east-1

# Crear usuario (envía email de invitación)
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --desired-delivery-mediums EMAIL \
  --region $REGION

# Agregar al grupo Administrators
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --group-name Administrators \
  --region $REGION
```

Para deshabilitar o eliminar un usuario:

```bash
aws cognito-idp admin-disable-user --user-pool-id $POOL_ID --username editor@example.com --region $REGION
aws cognito-idp admin-delete-user  --user-pool-id $POOL_ID --username editor@example.com --region $REGION
```

### Cambios de infraestructura

Los cambios en `infra/terraform/cognito.tf` enviados a `main` disparan el workflow `deploy-cognito`. El job de apply está protegido por el entorno GitHub `infra-production`.

### Rotación de credenciales de GitHub App

1. Actualizar los secretos `WORKER_GITHUB_*` en el entorno GitHub `prod`.
2. Ejecutar **Setup worker** con `action: sync-secrets`.

Ver [docs/workflows.md](docs/workflows.md).

### Validar contenido localmente

```bash
npm run content:validate          # validar JSON publicado
npm run validate -w @bonae/content -- apps/static/content drafts  # validar borradores
```

---

## Referencia de CI/CD

Ver **[docs/workflows.md](docs/workflows.md)** para todos los workflows de GitHub Actions, pasos de instalación y secretos.

---

## Referencia de comandos

| Comando | Descripción |
|---------|-------------|
| `npm ci` | Instalar todas las dependencias del workspace (desde la raíz del repo) |
| `npm run build` | Compilar content, sitio estático, admin SPA y Worker |
| `npm run build:all` | Alias de `npm run build` |
| `npm run test` | Ejecutar tests de seguridad del Worker |
| `npm run deploy:all` | Desplegar Worker y luego admin Pages |
| `npm run deploy:site` | Compilar y desplegar sitio de marketing |
| `npm run deploy:worker` | Compilar y desplegar Worker de API de contenido |
| `npm run deploy:admin` | Compilar y desplegar admin SPA |
| `npm run dev:admin:mock` | Admin SPA en modo mock (sin AWS) |
| `npm run dev:worker` | Servidor de desarrollo local del Worker |
| `npm run dev` | Servidor de desarrollo del sitio de marketing |
| `npm run content:validate` | Validar JSON publicado |

## Agregar un paquete nuevo

1. Crear un `package.json` bajo `apps/*`, `packages/*` o `workers/*` — npm workspaces lo descubre automáticamente.
2. Si consume el esquema compartido: `"@bonae/content": "*"` en `dependencies`.
3. Agregar scripts `build`, `dev` y/o `test` — Turborepo los detecta vía `turbo.json`.
4. Agregar filtros de ruta a los `.github/workflows/*.yml` relevantes si el paquete debe disparar CI o deploy.

**Ruta de crecimiento de CI:** usar `npx turbo run build test --filter=[origin/main...]` en PRs para compilar solo los paquetes afectados. La caché remota puede agregarse después vía `TURBO_TOKEN` / `TURBO_TEAM` en GitHub Actions.

---

## Licencia

Apache-2.0
