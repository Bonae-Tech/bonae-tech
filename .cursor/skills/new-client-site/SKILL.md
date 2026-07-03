---
name: new-client-site
description: >-
  Scaffold a new static client site under apps/clientes/ following SDD specs.
  Use when the user asks to create a client static app or scaffold apps/clientes/.
---

# New client static site

Create `apps/clientes/<slug>/` using SDD specs and `apps/static` as reference.

## Before coding

1. `docs/client-sites/reference-app-spec.md`
2. `docs/client-sites/app-architecture-spec.md`
3. `docs/client-sites/clients/<slug>.md`

## Checklist

- [ ] Scaffold en `apps/clientes/<slug>/`
- [ ] `package.json` → `"name": "cliente-<slug>"`
- [ ] `content/es.json` + `content/settings.json`
- [ ] `src/lib/content.ts` lee JSON local (sin `@bonae/content`)
- [ ] Una ruta `/`, `<html lang="es">`
- [ ] `npm run build --filter=cliente-<slug>` pasa

## No hacer

- Agregar clientes en `apps/static/`
- Usar SPA frameworks o rutas `/en/`

## Prompt

```
Crea la app en apps/clientes/<slug>/ siguiendo SDD.
@docs/client-sites/reference-app-spec.md
@docs/client-sites/app-architecture-spec.md
@docs/client-sites/clients/<slug>.md
```
