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

### Componentes

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
        Cognito["AWS Cognito\n(User Pool)"]
        ContentAPI["Content API\n(Cloudflare Worker)"]
        GitHub["GitHub\n(contenido respaldado por git)"]
    end

    subgraph "Modo mock"
        VitePlugin["Plugin mock de Vite\n(contentApiMockPlugin)"]
        LocalDisk["apps/static/content/\n(archivos JSON locales)"]
    end

    App --> Auth
    App --> Dashboard
    Dashboard --> API
    Auth -->|useMock=true| MockAuth
    Auth -->|useMock=false| CognitoAuth
    CognitoAuth --> Cognito
    API -->|real| ContentAPI
    ContentAPI --> GitHub
    API -->|mock| VitePlugin
    VitePlugin --> LocalDisk
```

### Flujo de usuario

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Auth as auth.ts
    participant Cognito as AWS Cognito
    participant API as contentApi.ts
    participant Backend as Content API

    Note over User,Backend: Inicio de sesión
    User->>App: abrir admin
    App->>Auth: getCurrentSession()
    Auth->>Cognito: getSession()
    Cognito-->>Auth: null (sin sesión)
    Auth-->>App: null
    App->>User: mostrar LoginForm
    User->>App: enviar email + contraseña
    App->>Auth: signIn(email, password)
    Auth->>Cognito: authenticateUser()
    Cognito-->>Auth: CognitoUserSession
    Auth-->>App: session
    App->>User: mostrar Dashboard

    Note over User,Backend: Cargar borrador
    App->>API: fetchDraft(locale)
    API->>Auth: getIdToken()
    Auth->>Cognito: getSession()
    Cognito-->>Auth: JWT id token
    API->>Backend: GET /content/drafts/{locale}<br/>Authorization: Bearer token
    Backend-->>API: { content, tier: "drafts" }
    API-->>App: ContentDocument

    Note over User,Backend: Guardar borrador
    User->>App: editar sección → Save
    App->>API: saveDraft(locale, doc)
    API->>Backend: PUT /content/drafts/{locale}<br/>Authorization: Bearer token
    Backend-->>API: { content, commitSha }
    API-->>App: Borrador guardado

    Note over User,Backend: Publicar
    User->>App: clic en "Publish site"
    App->>API: publishContent()
    API->>Backend: POST /content/publish<br/>Authorization: Bearer token
    Backend->>Backend: validar paridad ES/EN + settings
    Backend->>GitHub: confirmar drafts a published
    GitHub-->>Backend: commitSha
    Backend-->>API: { ok: true, commitSha }
    API-->>App: Publicado. Commit sha
```

### Árbol de archivos

```
src/
  config.ts                  # Lee vars de entorno, expone isConfigured()
  App.tsx                    # Puerta de auth: ConfigMissing | LoginForm | Dashboard
  infrastructure/
    auth.ts                  # Carga lazy auth.mock.ts o auth.cognito.ts
    auth.mock.ts             # Auth no-op para modo mock
    auth.cognito.ts          # Inicio/cierre/sesión Cognito
    contentApi.ts            # Wrapper fetch: fetchDraft, saveDraft, publishContent
  ui/
    Dashboard.tsx            # Layout con pestañas sobre todos los editores de sección
    LoginForm.tsx
    ConfigMissing.tsx
    components/
      JsonSectionEditor.tsx  # Editor JSON raw de respaldo
    sections/                # Formulario por sección de contenido (Hero, About, etc.)
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

Ver [docs/architecture.md](../../docs/architecture.md) y [docs/workflows.md](../../docs/workflows.md).
