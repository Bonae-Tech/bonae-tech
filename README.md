# BONAE Tech

Plataforma de contenido respaldada por Git para el sitio de marketing de [BONAE Tech](https://bonaetech.com/). Los editores actualizan los textos mediante un admin en React; la API de contenido corre en Cloudflare Workers; la identidad permanece en AWS Cognito.

## Estructura del repositorio

Monorepo npm workspaces + Turborepo. Componentes principales:

- **apps/static** — Sitio de marketing BONAE (Astro). Referencia SDD para apps de clientes; despliegue en Cloudflare Pages.
- **apps/clientes** — Apps estáticas de clientes (Astro), una carpeta por sitio. Guía: [`docs/client-sites/`](docs/client-sites/README.md).
- **apps/admin** — SPA de administración de contenido (React/Vite). Edita borradores y ejecuta el flujo de publicación; autenticación Cognito en producción o mock local.
- **workers/content-api** — Worker de Cloudflare: API de contenido con validación JWT y commits al repositorio vía GitHub App.
- **packages/content** — Esquema Zod compartido, validación y paridad de locales; consumido por static, admin y worker.
- **infra/terraform** — Infraestructura Terraform; solo identidad Cognito (AWS sa-east-1).

El contenido vive en `apps/static/content/`:

```
drafts/    
  es.json  
  en.json  
  settings.json   ← guardado por el admin
published/ 
  es.json  
  en.json  
  settings.json   ← leído por Astro en tiempo de build
```

---

## Onboarding

### Requisitos previos

- Node.js ≥ 20
- npm 10.9.2 (`packageManager` en el root; con Corepack: `corepack enable`)
- Turbo — incluido en devDependencies; CLI global opcional (`npm install -g turbo` o `npx turbo`)
- Terraform ≥ 1.6 y AWS CLI — solo para infraestructura y usuarios Cognito (AWS)

Todos los comandos siguientes se ejecutan en la raíz del repo.

### Turbo y comandos de arranque

Turborepo orquesta los workspaces (`apps/*`, `packages/*`, `workers/*`) ejecutando tareas por nombre (`build`, `dev`, `dev:mock`, `validate:published`, `deploy`, `test`) definidas en `turbo.json`. Los scripts `npm run …` del root invocan `turbo run …`; ambos son válidos — `turbo run` es el modelo canónico.

**Nombres para `--filter`** (campo `name` de cada `package.json`):

| Ruta | `--filter` |
|------|------------|
| `apps/static` | `bonae-static` |
| `apps/admin` | `bonae-admin` |
| `packages/content` | `@bonae/content` |
| `workers/content-api` | `@bonae/content-api-worker` |

**`--filter`:** limita la tarea al workspace indicado. Turbo respeta `dependsOn: ["^build"]` y compila dependencias upstream cuando hace falta (p. ej. `@bonae/content` antes de static, admin o worker).

```bash
turbo run build --filter=bonae-static              # solo sitio (+ @bonae/content vía ^build)
turbo run dev:mock --filter=bonae-admin            # admin mock (+ @bonae/content)
turbo run test --filter=@bonae/content-api-worker  # tests del worker (+ build previo)
```

#### Primera instalación

Paso 1. Clonar e instalar dependencias:

```bash
git clone https://github.com/mpiantella/bonae
cd bonae
npm ci
```

Instala todos los workspaces según `package-lock.json`.

Paso 2. Verificar compilación del monorepo:

```bash
turbo run build    # alias: npm run build
```

Compila `@bonae/content`, `bonae-static`, `bonae-admin` y `@bonae/content-api-worker` en orden de dependencias. Fallo aquí indica entorno o código roto antes de arrancar dev servers.

#### Ciclo diario de desarrollo

Paso 1. Validar contenido publicado (opcional si no se tocó `published/`; el sitio lo revalida en `predev`/`prebuild`):

```bash
turbo run validate:published --filter=@bonae/content    # alias: npm run content:validate
```

Paso 2. Sitio estático — lee `apps/static/content/published/`:

```bash
turbo run dev --filter=bonae-static    # http://localhost:4321 — alias: npm run dev
```

Paso 3. Admin mock — otra terminal; escribe en `apps/static/content/` en disco, sin Cognito:

```bash
turbo run dev:mock --filter=bonae-admin    # http://localhost:5173 — alias: npm run dev:admin:mock
```

Login mock: cualquier email/contraseña.

Paso 4. (Opcional) Worker de contenido local:

```bash
turbo run dev --filter=@bonae/content-api-worker    # wrangler dev — alias: npm run dev:worker
```

Paso 5. (Opcional) Admin con Cognito — requiere `.env` en `apps/admin/`:

```bash
turbo run dev --filter=bonae-admin    # alias: npm run dev:admin
```

#### Build completo

```bash
turbo run build    # alias: npm run build / npm run build:all
```

Compila los cuatro workspaces. Usar tras cambios transversales, antes de deploy o para reproducir CI localmente.

Compilar un solo componente:

```bash
turbo run build --filter=@bonae/content              # alias: npm run content:build
turbo run build --filter=bonae-admin                 # alias: npm run admin:build
turbo run build --filter=@bonae/content-api-worker   # alias: npm run worker:build
```

#### Validar contenido

```bash
turbo run validate:published --filter=@bonae/content    # published/ — alias: npm run content:validate
turbo run validate:drafts --filter=@bonae/content       # drafts/ — alias: npm run content:validate:drafts
```

Contenido inválido en `published/` bloquea `dev` y `build` del sitio.

#### Preview y deploy

Preview local del sitio (requiere build previo):

```bash
turbo run build --filter=bonae-static
npm run preview    # astro preview — sirve `dist/` del sitio estático
```

Workflows: Deploy a Cloudflare (requiere credenciales Wrangler configuradas):

```bash
turbo run deploy --filter=bonae-static                         # alias: npm run deploy:site
turbo run deploy --filter=bonae-admin                          # alias: npm run deploy:admin
turbo run deploy --filter=@bonae/content-api-worker            # alias: npm run deploy:worker
turbo run deploy --filter=bonae-static --filter=bonae-admin --filter=@bonae/content-api-worker    # alias: npm run deploy:all
```
---

## Instalación de plataforma (DevOps)

Solo necesaria **una vez por entorno** (AWS Cognito + Cloudflare). No confundir con el onboarding de desarrollo local anterior.

1. Bootstrap Terraform local → [`infra/terraform/bootstrap`](infra/terraform/bootstrap)
2. Secretos GitHub entorno **prod**: `CLOUDFLARE_*`, `WORKER_GITHUB_*`
3. Workflow **Bootstrap (one-time install)** con `step: full`

Guía completa: [docs/workflows.md#instalación-única](docs/workflows.md#instalación-única)

### ¿Qué workflow uso?

| Situación | Workflow |
|-----------|----------|
| Primera vez en prod | [Bootstrap (one-time install)](.github/workflows/bootstrap.yml) — `step: full` |
| Push a `main` / cambio de código | Deploy site / admin / worker (automático) |
| Redeploy manual de un componente | [Deploy (manual)](.github/workflows/deploy.yml) |
| Rotar secretos del Worker | [Setup worker](.github/workflows/setup-worker.yml) — `action: sync-secrets` |
| PR de contenido JSON | [Content PR check](.github/workflows/content-pr-check.yml) |

---

## Mantenimiento

### Flujo de contenido

Los editores inician sesión en el admin SPA → editan secciones en ES/EN → **Save draft** (confirma en `drafts/`) → **Publish** (copia `drafts/` → `published/` en un commit, dispara rebuild de Cloudflare).

Ver [apps/admin/README.md](apps/admin/README.md) para el flujo completo del editor e instrucciones de desarrollo local.

Reglas aplicadas en cada guardado:
- Los documentos ES y EN deben tener longitudes de arreglo coincidentes en todas las rutas mapeadas (paridad de locale)
- El contenido publicado se valida antes de cada build del sitio; un `published/` inválido bloqueará el build

### Cambios de infraestructura

Los cambios en `infra/terraform/cognito.tf` enviados a `main` disparan el workflow `deploy-cognito`. El job de apply está protegido por el entorno GitHub `infra-production`.

### Rotación de credenciales de GitHub App

1. Actualizar los secretos `WORKER_GITHUB_*` en el entorno GitHub `prod`.
2. Ejecutar **Setup worker** con `action: sync-secrets`.

Ver [docs/workflows.md](docs/workflows.md).

### Validar contenido localmente

```bash
npm run content:validate         # published/ (ver [Onboarding](#onboarding))
npm run content:validate:drafts  # drafts/
```

---

## Referencia de CI/CD

Ver **[docs/workflows.md](docs/workflows.md)** para todos los workflows de GitHub Actions, pasos de instalación y secretos.

---

## Referencia de comandos

La tabla lista los scripts `npm run …` del root como referencia rápida; para entender *qué* ejecuta cada tarea y acotar el alcance, usar los comandos `turbo run …` (modelo canónico — ver [Onboarding](#turbo-y-comandos-de-arranque)). Los scripts del root invocan `turbo run …`; Turbo a su vez ejecuta los scripts homónimos (`build`, `dev`, `test`, …) definidos en el `package.json` de cada workspace.

- **npm workspaces** — define el monorepo, enlaza dependencias locales entre paquetes, permite un solo `npm ci` en la raíz y flags `-w <workspace>` para invocar scripts de un paquete concreto sin pasar por Turbo.
- **Turborepo** — orquesta el grafo de tareas (`dependsOn: ["^build"]`), caché, ejecución en paralelo y filtros `--filter=<nombre-paquete>` sobre los scripts de cada workspace.

| Comando | Descripción |
|---------|-------------|
| `npm ci` | Instalar todas las dependencias del workspace (desde la raíz del repo) |
| `npm run build` | Compilar content, sitio estático, admin SPA y Worker |
| `npm run build:all` | Alias de `npm run build` |
| `npm run test` | Ejecutar tests de seguridad del Worker |
| `npm run deploy:all` | Desplegar site, admin Pages y Worker |
| `npm run deploy:site` | Compilar y desplegar sitio de marketing |
| `npm run deploy:worker` | Compilar y desplegar Worker de API de contenido |
| `npm run deploy:admin` | Compilar y desplegar admin SPA |
| `npm run dev:admin:mock` | Admin SPA en modo mock (sin AWS) |
| `npm run dev:admin` | Admin SPA con Cognito (requiere `.env`) |
| `npm run dev:worker` | Servidor de desarrollo local del Worker |
| `npm run dev` | Servidor de desarrollo del sitio de marketing |
| `npm run content:build` | Compilar solo `@bonae/content` |
| `npm run content:validate` | Validar JSON publicado |
| `npm run content:validate:drafts` | Validar JSON en borradores |

## Agregar un paquete nuevo

1. Crear un `package.json` bajo `apps/*`, `packages/*` o `workers/*` — npm workspaces lo descubre automáticamente.
2. Si consume el esquema compartido: `"@bonae/content": "*"` en `dependencies`.
3. Agregar scripts `build`, `dev` y/o `test` — Turborepo los detecta vía `turbo.json`.
4. Agregar filtros de ruta a los `.github/workflows/*.yml` relevantes si el paquete debe disparar CI o deploy.

**Ruta de crecimiento de CI:** usar `npx turbo run build test --filter=[origin/main...]` en PRs para compilar solo los paquetes afectados. La caché remota puede agregarse después vía `TURBO_TOKEN` / `TURBO_TEAM` en GitHub Actions.

---

## Licencia

Apache-2.0
