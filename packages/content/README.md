# @bonae/content

Esquema Zod compartido, tipos y validadores consumidos por `apps/static`, `apps/admin` y `workers/content-api`. Turborepo compila este paquete antes que cualquier consumidor vía `dependsOn: ["^build"]`.

## Build

Desde la raíz del repo:

```bash
npm ci
npm run content:build    # turbo run build --filter=@bonae/content
```

O desde este directorio (contexto de workspace):

```bash
npm run build    # tsc → dist/
```

## Exportaciones clave

| Exportación | Descripción |
|--------|-------------|
| `ContentDocument` | Tipo validado con Zod para copy del sitio ES o EN |
| `SiteSettings` | siteUrl, WhatsApp, enlaces sociales/legales |
| `parseContentDocument` / `parseSiteSettings` | Parsear + validar un objeto raw |
| `assertLocaleParity` | Lanza error si los documentos ES y EN tienen longitudes de arreglo distintas |
| `loadPublishedFromDir` | Usado por Astro para cargar contenido publicado en tiempo de build |
| `checkLocaleParity` | Devuelve errores de paridad sin lanzar excepción |

## Validar contenido

```bash
# Desde la raíz del repo (Turbo)
npm run content:validate           # published/
```

## Reglas

- Los documentos ES y EN deben tener **longitudes de arreglo coincidentes** en todas las rutas mapeadas. `assertLocaleParity` se llama en cada guardado de borrador y de nuevo al publicar.
- El entrypoint `cli.js` lo usan los hooks `prebuild` y `predev` en `apps/static` — si `dist/` no existe, esos hooks fallarán.
