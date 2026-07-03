# Guía SDD — Apps estáticas de clientes

Crear **nuevas apps Astro** en `apps/clientes/<slug>/`, usando [`apps/static/`](../../apps/static/) como referencia de estructura y diseño.

## Documentos

| Archivo | Para qué |
|---------|----------|
| [reference-app-spec.md](./reference-app-spec.md) | Qué copiar de `apps/static` |
| [app-architecture-spec.md](./app-architecture-spec.md) | Reglas técnicas obligatorias |
| [client-app-spec-template.md](./client-app-spec-template.md) | Plantilla para definir un cliente |
| [clients/](./clients/) | Un archivo `.md` por app a generar |

## Uso rápido

1. Copia la plantilla → `clients/<slug>.md` y complétala.
2. Pide a la IA:
   ```
   Crea la app en apps/clientes/<slug>/ siguiendo SDD.
   @docs/client-sites/reference-app-spec.md
   @docs/client-sites/app-architecture-spec.md
   @docs/client-sites/clients/<slug>.md
   ```
3. Valida: `npm run build --filter=cliente-<slug>`

## Dónde va cada cosa

| Qué | Dónde |
|-----|-------|
| Sitio BONAE | `apps/static/` |
| Apps de clientes | `apps/clientes/<slug>/` |
| Spec del cliente | `docs/client-sites/clients/<slug>.md` |
| Copy del sitio (español) | `apps/clientes/<slug>/content/es.json` |
| Config (WhatsApp, redes) | `apps/clientes/<slug>/content/settings.json` |

## Reglas Cursor

- [`.cursor/rules/client-sites-sdd.mdc`](../../.cursor/rules/client-sites-sdd.mdc)
- [`.cursor/skills/new-client-site/SKILL.md`](../../.cursor/skills/new-client-site/SKILL.md)
