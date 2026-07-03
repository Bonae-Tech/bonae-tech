# Apps estáticas de clientes

Cada subcarpeta es una **aplicación Astro independiente** (sitio estático de un cliente).

```
apps/clientes/
  <slug>/          ← app generada vía SDD
    package.json   name: "cliente-<slug>"
    src/
    content/
    ...
```

## Crear una app nueva

Sigue la guía SDD en [`docs/client-sites/`](../../docs/client-sites/README.md):

1. Completa `docs/client-sites/clients/<slug>.md`
2. Genera la app con IA usando los specs + `apps/static` como referencia
3. Valida: `npm run build --filter=cliente-<slug>`

## Referencia

El sitio BONAE en [`apps/static/`](../static/) es la implementación de referencia. **No agregar clientes ahí** — solo en `apps/clientes/<slug>/`.

## Contenido (v1)

Cada app tiene JSON local en español:

```
content/published/es.json
content/published/settings.json
```

El flujo admin centralizado llegará en una fase posterior.
