# [Nombre del cliente]

> Copiar este archivo a `clients/<slug>.md` y completar todas las secciones antes de pedir generación a la IA.

## Slug

`<slug>` — nombre de carpeta: `apps/clientes/<slug>/`  
Package name: `cliente-<slug>`

## Objetivo

[Un párrafo: qué es el sitio y para quién]

## Dominio (producción)

`https://…`

## Cloudflare Pages project name

`…`

## Secciones (orden + propósito)

1. **[Nombre]** — [propósito]
2. …

## Copy por sección (español)

### [Sección 1]

- **Título:** …
- **Subtítulo / cuerpo:** …

### [Sección 2]

…

## Branding

| Token | Valor | Notas |
|-------|-------|-------|
| Color primario | `#…` | Reemplaza `dark-blue` o `terracotta` |
| Color acento | `#…` | |
| Fondo | `#…` | Default referencia: `cream` |
| Fuente | Inter Variable | o especificar otra |

## Contacto

- WhatsApp: `[código país][número]` (sin +)
- Mensaje predefinido WhatsApp: «…»
- Email / dirección (si aplica): …

## Componentes

| Acción | Componente |
|--------|------------|
| Crear | `Hero.astro`, … |
| Adaptar del patrón BONAE | `Footer.astro`, `WhatsAppFloat.astro` |
| No incluir | … |

## Interactividad

- [ ] Cookie banner (`<script is:inline>` + localStorage)
- [ ] Otro: …

## SEO

- **title:** …
- **description:** …
- **theme-color:** `#…`

## Criterios de aceptación

- [ ] `npm run build --filter=cliente-<slug>` pasa
- [ ] Una sola ruta `/` en español
- [ ] WhatsApp funcional con número del spec
- [ ] Colores acordes al branding
- [ ] Responsive (mobile + desktop)
