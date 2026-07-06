# Cartas flip de Value Prop — guía de edición

Las cartas de la sección **Value Prop** (`#servicios`) tienen dos caras. Al pasar el cursor (o enfocar con teclado/tap en móvil), la carta se voltea y muestra información adicional.

## Qué campo edita cada cara

| Cara | Badge visible | Campo JSON | Uso |
|------|---------------|------------|-----|
| **Frente** | *(ninguno)* | `title` + `description` | Título del servicio y descripción |
| **Reverso** | `backLabel` (por carta) | `backLabel` + `backDescription` | Etiqueta y texto del reverso |

Los badges del reverso (`backLabel`) son **editables por carta** en el admin o JSON. El frente no lleva badge.

## Dónde editar el contenido

### Opción 1 — Admin (recomendado en desarrollo)

```bash
npm run admin:dev:mock
```

1. Inicia sesión (modo mock, sin Cognito).
2. Ve a **Value proposition**.
3. Por cada carta:
   - **Title (frente)** — nombre del servicio.
   - **Descripción (frente)** — campo `description`.
   - **Etiqueta reverso** — campo `backLabel` (ej. *Accesible*, *Nuestra propuesta*).
   - **Texto reverso** — campo `backDescription`.
4. Guarda draft en **ES** y repite en **EN** con la misma cantidad de cartas.
5. Publica cuando ambos idiomas estén alineados.

### Opción 2 — JSON directo (solo contenido publicado)

Para cambios que afecten el sitio en build, edita:

```
apps/static/content/published/es.json
apps/static/content/published/en.json
```

En desarrollo con admin mock, edita vía la UI y publica; eso escribe `published/` en disco.

Ejemplo de una carta en `valueProp.items`:

```json
{
  "icon": "accessible",
  "title": "Presencia Web de alto impacto",
  "description": "Diseñamos y lanzamos tu sitio web profesional, listo para captar clientes.",
  "backLabel": "Accesible",
  "backDescription": "Precios acordes al mercado, desde planes básicos hasta soluciones completas, con opciones de financiación."
}
```

Iconos permitidos: `accessible`, `simple`, `secure`, `close`.

## Reglas importantes

- **Paridad ES/EN:** misma cantidad de cartas en ambos idiomas (requerida al **publicar**).
- **Campos obligatorios:** `title`, `description` y `backDescription` no pueden estar vacíos.
- **Borradores vs publicado:** [architecture.md § Niveles de contenido](./architecture.md#niveles-de-contenido-draft-vs-publicado).

## Probar cambios localmente

```bash
npm run content:build          # recompila esquema si cambiaste packages/content
npm run admin:dev:mock         # editar en admin
npm run dev                    # ver sitio con published/
```

Tras editar JSON a mano en `published/`, valida antes del build:

```bash
npm run content:validate
cd apps/static && npm run build
```

## Comportamiento visual

- **Desktop:** hover sobre la carta → volteo 3D.
- **Teclado / móvil:** la carta tiene foco (`tabindex="0"`); al enfocar también voltea.
- **Accesibilidad:** si el usuario tiene `prefers-reduced-motion`, no hay animación; se muestran frente y reverso apilados.

## Archivos técnicos (si cambias diseño o estructura)

| Archivo | Rol |
|---------|-----|
| `packages/content/src/schema.ts` | Define campos y validación Zod |
| `apps/static/src/components/IconCard.astro` | Markup de la carta flip |
| `apps/static/src/components/ValueProp.astro` | Grid y labels por idioma |
| `apps/static/src/styles/global.css` | Clases `.flip-card*` |
| `apps/admin/src/ui/sections/ValuePropSectionForm.tsx` | Formulario del admin |

## Textos provisionales actuales

Los textos iniciales separan:

- **Frente (`description`):** qué hacemos concretamente por el cliente.
- **Reverso (`backDescription`):** beneficio, propuesta o detalle ampliado (basado en el copy anterior del sitio).

Puedes reemplazarlos libremente respetando la convención frente = acción breve, reverso = propuesta detallada.
