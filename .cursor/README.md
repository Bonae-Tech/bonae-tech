# Cursor — configuración compartida

Archivos versionados para que todo el equipo (y la IA) use las mismas reglas y planes.

| Carpeta | Contenido |
|---------|-----------|
| [`rules/`](rules/) | Reglas Cursor (`.mdc`) — contexto automático por glob |
| [`plans/`](plans/) | Planes de implementación (SDD, auth, infra…) |
| [`skills/`](skills/) | Skills de agente (workflows reutilizables) |

## Reglas activas

- [`rules/static-site.mdc`](rules/static-site.mdc) — sitio BONAE (`apps/static/`) y flujo de contenido
- [`rules/client-sites-sdd.mdc`](rules/client-sites-sdd.mdc) — apps de clientes en `apps/clientes/`

## Guía SDD de clientes

Ver [`docs/client-sites/`](../docs/client-sites/README.md).
