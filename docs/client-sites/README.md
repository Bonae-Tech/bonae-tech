# Guía SDD — Apps estáticas de clientes

Spec-Driven Development para crear **nuevas aplicaciones estáticas** bajo `apps/clientes/<slug>/`, usando [`apps/static/`](../../apps/static/) (sitio BONAE Tech) como implementación de referencia.

## Documentos

| Archivo | Propósito |
|---------|-----------|
| [reference-app-spec.md](./reference-app-spec.md) | Qué copiar de `apps/static`: estructura, componentes, tokens, patrones |
| [app-architecture-spec.md](./app-architecture-spec.md) | Reglas técnicas obligatorias para toda app nueva |
| [client-app-spec-template.md](./client-app-spec-template.md) | Plantilla para definir un cliente antes de generar código |
| [clients/](./clients/) | Un spec por app a crear |
| [clients/ejemplo-restaurante.md](./clients/ejemplo-restaurante.md) | Spec de ejemplo (La Casona) |

## Workflow

1. **Completar** `clients/<slug>.md` usando la plantilla.
2. **Pedir a la IA** (Cursor) con referencias explícitas:
   ```
   Crea la app estática siguiendo SDD.
   @docs/client-sites/reference-app-spec.md
   @docs/client-sites/app-architecture-spec.md
   @docs/client-sites/clients/<slug>.md
   Usa apps/static como referencia de estructura.
   ```
3. **La IA genera** `apps/clientes/<slug>/` (app Astro completa).
4. **Validar:** `npm run build --filter=cliente-<slug>`
5. **Deploy:** Cloudflare Pages con el project name del spec.

## Separación de responsabilidades

| Qué | Dónde |
|-----|-------|
| Sitio BONAE (producción) | `apps/static/` — no agregar clientes aquí |
| Patrón / referencia | `apps/static/` + esta guía |
| Apps de clientes | `apps/clientes/<slug>/` |
| Spec de un cliente | `docs/client-sites/clients/<slug>.md` |

## Contenido (v1)

Cada app de cliente tiene JSON local en español:

```
apps/clientes/<slug>/content/published/
  es.json
  settings.json
```

Editado en repo o generado desde el spec. El flujo admin centralizado (drafts → publish) se documentará cuando esté disponible; por ahora es fuera de alcance.

## Ejemplo incluido

| Spec | App generada |
|------|--------------|
| [clients/ejemplo-restaurante.md](./clients/ejemplo-restaurante.md) | [apps/clientes/ejemplo-restaurante/](../../apps/clientes/ejemplo-restaurante/) |

```bash
npm run dev --filter=cliente-ejemplo-restaurante
npm run build --filter=cliente-ejemplo-restaurante
```

## Reglas Cursor

- Regla: [`.cursor/rules/client-sites-sdd.mdc`](../../.cursor/rules/client-sites-sdd.mdc) (activa en `apps/clientes/**` y `docs/client-sites/**`)
- Skill: [`.cursor/skills/new-client-site/SKILL.md`](../../.cursor/skills/new-client-site/SKILL.md)
