# bonae-admin

Interfaz de gestión de contenido para editar y publicar textos del sitio (ES/EN) y configuración.

## Stack

- React 18 + TypeScript, Vite, Tailwind CSS
- Auth: Amazon Cognito (`amazon-cognito-identity-js`)
- Obtención de datos: TanStack Query
- Formularios: React Hook Form + Zod
- Validación de contenido: `@bonae/content` (paquete local)

## Configuración

```bash
cp .env.example .env
```

Completar `.env`:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL base de la API de contenido (dejar vacío para same-origin `/content/*` en Cloudflare Pages) |
| `VITE_COGNITO_USER_POOL_ID` | ID del User Pool de Cognito |
| `VITE_COGNITO_CLIENT_ID` | ID del App Client de Cognito |
| `VITE_AWS_REGION` | Región AWS (predeterminado: `sa-east-1`) |

## Desarrollo

**Modo mock** — sin AWS, sin backend. Lee/escribe `apps/static/content/` en disco:

```bash
npm run dev:mock
```

**Modo real** — requiere `.env` con config válida de Cognito + API:

```bash
npm run dev
```

El modo mock está activo cuando `VITE_USE_MOCK=true`. Se omite la auth y el servidor de desarrollo Vite intercepta localmente todas las llamadas API `/content/*`.

## Build

```bash
npm run build
```

Ejecuta `tsc --noEmit` y luego `vite build`. La salida va a `dist/`.

## Arquitectura

Flujos de autenticación end to end (sign-in, refresh, expiry, password reset, SES, API autorizada): **[docs/admin-authentication.md](../../docs/admin-authentication.md)** — documento canónico del repositorio para estos flujos.

### Componentes en el admin SPA

```mermaid
graph TD
    subgraph Browser
        App["App.tsx\n(puerta de auth)"]
        Dashboard["Dashboard\n(formularios de sección + locale)"]
        Auth["infrastructure/auth.ts\n(cargador lazy)"]
        API["infrastructure/contentApi.ts"]
    end

    subgraph "Capa de auth"
        MockAuth["auth.mock.ts\n(sessionStorage)"]
        CognitoAuth["auth.cognito.ts"]
    end

    subgraph "Modo real"
        Cognito["AWS Cognito"]
        ContentAPI["Content API\n(Cloudflare Worker)"]
    end

    subgraph "Modo mock"
        VitePlugin["Plugin mock de Vite"]
        LocalDisk["apps/static/content/"]
    end

    App --> Auth
    App --> Dashboard
    Dashboard --> API
    Auth -->|useMock=true| MockAuth
    Auth -->|useMock=false| CognitoAuth
    CognitoAuth --> Cognito
    API -->|real| ContentAPI
    API -->|mock| VitePlugin
    VitePlugin --> LocalDisk
```

Vista resumida de componentes locales. Secuencias detalladas, principios de diseño y servicios AWS: [docs/admin-authentication.md](../../docs/admin-authentication.md).

### Árbol de archivos

```
src/
  config.ts                  # Lee vars de entorno, expone isConfigured()
  App.tsx                    # Puerta de auth: login | forgot | reset | newPassword | Dashboard
  infrastructure/
    auth.ts                  # Carga lazy auth.mock.ts o auth.cognito.ts
    auth.mock.ts             # Auth no-op para modo mock
    auth.cognito.ts          # SRP, refresh, forgot/confirm password
    cognitoErrors.ts         # Mensajes de error amigables (Cognito)
    passwordPolicy.ts        # Validación de contraseña (cliente)
    contentApi.ts            # Wrapper fetch: fetchDraft, saveDraft, publishContent
  ui/
    Dashboard.tsx            # Layout con pestañas; banner de sesión extendida
    LoginForm.tsx
    ForgotPasswordForm.tsx
    ResetPasswordForm.tsx
    ConfigMissing.tsx
```

### Superficie de API (`contentApi.ts`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/content/drafts/{es\|en\|settings}` | Cargar borrador |
| `PUT` | `/content/drafts/{es\|en\|settings}` | Guardar borrador |
| `POST` | `/content/publish` | Promover borradores a publicado |

Todas las solicitudes envían un token ID de Cognito `Bearer`. En modo mock el plugin Vite maneja estas rutas directamente contra `apps/static/content/`.

## Flujo del editor

1. Iniciar sesión (usuario Cognito en el grupo `Administrators`, o cualquier credencial en modo mock)
2. Seleccionar locale (ES / EN) y sección
3. Editar campos y hacer clic en **Save draft** — confirma en `content/drafts/` vía la API de contenido
4. Hacer clic en **Publish site** — copia `drafts/` → `published/` en un commit; dispara rebuild automático de Cloudflare Pages

Los borradores nunca son visibles en el sitio de marketing público hasta publicarlos.

## Reglas

- Los documentos ES y EN deben tener **longitudes de arreglo coincidentes** en todas las rutas mapeadas (paridad de locale). La API rechaza guardados que rompan la paridad.
- El sitio estático lee solo `content/published/` — nunca `content/drafts/`.
- Los usuarios son solo por invitación — sin auto-registro. Crear usuarios vía `aws cognito-idp admin-create-user`.

## Deploy

Los deploys los maneja `deploy-admin.yml` en push a `main` (proyecto Cloudflare Pages `bonae-admin`). Los IDs de Cognito se incluyen en tiempo de build desde variables del repositorio GitHub. Dejar `API_BASE_URL` vacío para enrutamiento same-origin de la API vía service binding de Pages.

Ver [docs/admin-authentication.md](../../docs/admin-authentication.md) (auth), [docs/architecture.md](../../docs/architecture.md) (plataforma) y [docs/workflows.md](../../docs/workflows.md) (CI/CD).

### Gestión de usuarios Cognito

Los usuarios son solo por invitación (`allow_admin_create_user_only = true`). Crear usuarios vía AWS CLI — reciben una contraseña temporal por email y deben establecer una permanente en el primer inicio de sesión.

```bash
POOL_ID=$(cd infra/terraform && terraform output -raw user_pool_id)
REGION=sa-east-1

# Crear usuario (envía email de invitación; email_verified requerido para reset de contraseña)
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username editor@example.com \
  --user-attributes Name=email,Value=editor@example.com Name=email_verified,Value=true \
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
