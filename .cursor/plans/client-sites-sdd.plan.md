---
name: Client Sites SDD
overview: Guía SDD para generar apps estáticas en apps/clientes/* usando apps/static como referencia (Astro + Tailwind + scripts inline, español, content/es.json).
todos:
  - id: create-docs-structure
    content: docs/client-sites/ con README, reference-app-spec, app-architecture-spec, client-app-spec-template
    status: completed
  - id: setup-clientes-workspace
    content: apps/clientes/README.md y workspace apps/clientes/* en package.json
    status: completed
  - id: cursor-rule-sdd
    content: .cursor/rules/client-sites-sdd.mdc
    status: completed
  - id: cursor-skill
    content: .cursor/skills/new-client-site/SKILL.md
    status: completed
  - id: track-cursor-in-git
    content: Versionar .cursor/rules, .cursor/plans y .cursor/skills en el repo
    status: completed
isProject: true
---

# Plan: Client Sites SDD

## Objetivo

Documentación y tooling Cursor para crear **nuevas apps Astro** en `apps/clientes/<slug>/`, usando `apps/static/` como referencia de estructura.

## Artefactos

| Tipo | Ubicación |
|------|-----------|
| Guía humana/IA | `docs/client-sites/` |
| App de referencia | `apps/static/` (no modificar para clientes) |
| Apps generadas | `apps/clientes/<slug>/` |
| Regla Cursor | `.cursor/rules/client-sites-sdd.mdc` |
| Skill | `.cursor/skills/new-client-site/SKILL.md` |

## Contenido por app

```
content/es.json
content/settings.json
```

Sin `@bonae/content` en v1. Solo español, ruta `/`.

## Workflow

1. Completar `docs/client-sites/clients/<slug>.md` desde la plantilla
2. IA genera `apps/clientes/<slug>/` siguiendo specs + `apps/static`
3. `npm run build --filter=cliente-<slug>`
