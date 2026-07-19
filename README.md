# BONAE Tech

Plataforma de contenido respaldada por Git para el sitio de marketing de [BONAE Tech](https://bonaetech.com/). Los editores actualizan los textos mediante un admin en React; la API de contenido corre en Cloudflare Workers; la identidad permanece en AWS Cognito.

## Estructura del repositorio

Monorepo npm workspaces + Turborepo. Componentes principales:

- **apps/static** — Sitio de marketing estático (Astro). Lee JSON publicado en tiempo de build; despliegue en Cloudflare Pages.
- **apps/admin** — SPA de administración de contenido (React/Vite). Edita borradores y ejecuta el flujo de publicación; autenticación Cognito en producción o mock local.
- **workers/content-api** — Worker de Cloudflare: API de contenido con validación JWT y commits al repositorio vía GitHub App.
- **packages/content** — Esquema Zod compartido, validación y paridad de locales; consumido por static, admin y worker.
- **infra/terraform** — Infraestructura Terraform; solo identidad Cognito (AWS sa-east-1).

El contenido publicado vive en `apps/static/content/published/` (`es.json`, `en.json`, `settings.json`). Los borradores **no** están en git — persisten en el ContentStore Durable Object (producción) o en memoria (admin mock). Modelo completo: [docs/architecture.md § Niveles de contenido](docs/architecture.md#niveles-de-contenido-draft-vs-publicado).

---

## Onboarding

### Requisitos previos

- Node.js ≥ 24 (Active LTS; see `.nvmrc`)
- npm 10.9.2 (`packageManager` en el root; con Corepack: `corepack enable`)
- Turbo — incluido en devDependencies; CLI global opcional (`npm install -g turbo` o `npx turbo`)
- Terraform ≥ 1.6 y AWS CLI — solo para infraestructura y usuarios Cognito (AWS)

Todos los comandos siguientes se ejecutan en la raíz del repo. Los scripts `npm run …` del root son aliases de `turbo run …`.

### Primera instalación

```bash
git clone https://github.com/Bonae-Tech/bonae-tech
cd bonae-tech
npm ci
turbo run build    # npm run build
```

### Comandos por componente (build → serve)

| Ruta | `--filter` |
|------|------------|
| `packages/content` | `@bonae/content` |
| `apps/static` | `bonae-static` |
| `apps/admin` | `bonae-admin` |
| `workers/content-api` | `@bonae/content-api-worker` |

```bash
# monorepo
turbo run build                                                                                     # npm run build
turbo run test --filter=@bonae/content-api-worker --filter=bonae-admin                              # npm run test
turbo run deploy --filter=bonae-static --filter=bonae-admin --filter=@bonae/content-api-worker     # npm run deploy:all

# packages/content
turbo run build --filter=@bonae/content                                                             # npm run content:build
turbo run validate:published --filter=@bonae/content                                                # npm run content:validate

# apps/static
turbo run build --filter=bonae-static                                                               # build
npm run preview                                                                                     # serve dist/
turbo run dev --filter=bonae-static                                                                 # npm run dev — :4321
turbo run deploy --filter=bonae-static                                                              # npm run deploy:site

# apps/admin
turbo run build --filter=bonae-admin                                                                # npm run admin:build
turbo run test --filter=bonae-admin                                                                 # npm run admin:test
npm run preview -w bonae-admin                                                                      # serve dist/
turbo run dev:mock --filter=bonae-admin                                                             # npm run dev:admin:mock — :5173
turbo run dev --filter=bonae-admin                                                                  # npm run dev:admin — Cognito .env
turbo run deploy --filter=bonae-admin                                                               # npm run deploy:admin

# workers/content-api
turbo run build --filter=@bonae/content-api-worker                                                  # npm run worker:build
turbo run test --filter=@bonae/content-api-worker                                                   # npm run worker:test
turbo run dev --filter=@bonae/content-api-worker                                                    # npm run dev:worker
turbo run deploy --filter=@bonae/content-api-worker                                                 # npm run deploy:worker
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

Los editores inician sesión en el admin SPA → editan secciones en ES/EN → **Save draft** (DO o memoria en mock) → **Publish** (commit atómico a `published/` en GitHub). Ver [docs/architecture.md](docs/architecture.md#niveles-de-contenido-draft-vs-publicado) y [apps/admin/README.md](apps/admin/README.md).

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
```

---

## Referencia de CI/CD

Ver **[docs/workflows.md](docs/workflows.md)** para todos los workflows de GitHub Actions, pasos de instalación y secretos.

---

## Referencia de comandos

Lista canónica por componente: [Comandos por componente](#comandos-por-componente-build--serve).

- **npm workspaces** — monorepo, un solo `npm ci`, flag `-w <workspace>` para scripts de un paquete sin Turbo.
- **Turborepo** — orquesta tareas (`dependsOn: ["^build"]`), caché y `--filter=<nombre-paquete>`. Los `npm run …` del root invocan `turbo run …`.

## Agregar un paquete nuevo

1. Crear un `package.json` bajo `apps/*`, `packages/*` o `workers/*` — npm workspaces lo descubre automáticamente.
2. Si consume el esquema compartido: `"@bonae/content": "*"` en `dependencies`.
3. Agregar scripts `build`, `dev` y/o `test` — Turborepo los detecta vía `turbo.json`.
4. Agregar filtros de ruta a los `.github/workflows/*.yml` relevantes si el paquete debe disparar CI o deploy.

**Ruta de crecimiento de CI:** usar `npx turbo run build test --filter=[origin/main...]` en PRs para compilar solo los paquetes afectados. La caché remota puede agregarse después vía `TURBO_TOKEN` / `TURBO_TEAM` en GitHub Actions.

---

## Licencia

Apache-2.0
