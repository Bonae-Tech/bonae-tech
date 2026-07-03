# Apps estáticas de clientes

Cada subcarpeta es una app Astro independiente.

## Crear una app

Guía completa: [`docs/client-sites/`](../../docs/client-sites/README.md)

1. Completa `docs/client-sites/clients/<slug>.md`
2. Genera `apps/clientes/<slug>/` con IA (referencia: `apps/static/`)
3. Valida: `npm run build --filter=cliente-<slug>`

## Contenido

```
content/es.json       ← textos (español)
content/settings.json ← WhatsApp, redes, links legales
```

Referencia de arquitectura: [`apps/static/`](../static/) — no agregar clientes ahí.
