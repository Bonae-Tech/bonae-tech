# La Casona — ejemplo de app cliente

> Spec de ejemplo para demostrar el flujo SDD. Genera `apps/clientes/ejemplo-restaurante/`.

## Slug

`ejemplo-restaurante`  
Package name: `cliente-ejemplo-restaurante`

## Objetivo

Landing de un restaurante venezolano con menú destacado, horarios y contacto por WhatsApp.

## Dominio (producción)

`https://lacasona.example.com`

## Cloudflare Pages project name

`cliente-la-casona`

## Secciones (orden + propósito)

1. **Hero** — Nombre del restaurante, tagline y CTA reservar por WhatsApp
2. **Menú destacado** — 6 platos con nombre, descripción y precio
3. **Horarios y ubicación** — Días, horas y dirección en Caracas
4. **Contacto** — WhatsApp, email y mapa textual

## Copy por sección (español)

### Hero

- **Badge:** Cocina criolla · Caracas
- **Título:** La Casona
- **Subtítulo:** Sabores de la tradición venezolana en un ambiente acogedor. Reserva tu mesa hoy.
- **CTA:** Reservar por WhatsApp

### Menú destacado

- **Título:** Nuestros platos
- **Subtítulo:** Selección de la casa — consulta la carta completa en el local

| Plato | Descripción | Precio |
|-------|-------------|--------|
| Pabellón criollo | Carne mechada, caraotas, arroz, tajadas y huevo | $12 |
| Asado negro | Lomo en salsa dulce con puré de papas | $14 |
| Hallaca de la casa | Receta familiar envuelta en hoja de plátano | $8 |
| Cachapa con queso | Cachapa de maíz tierno con queso de mano | $9 |
| Sopa de mondongo | Sopa tradicional de fin de semana | $10 |
| Tres leches | Postre clásico venezolano | $6 |

### Horarios

- **Título:** Horarios y ubicación
- **Horario:** Lun–Jue 12:00–22:00 · Vie–Sáb 12:00–23:00 · Dom 12:00–21:00
- **Dirección:** Av. Principal de Las Mercedes, Caracas, Venezuela

### Contacto

- **Título:** Contáctanos
- **Texto:** ¿Reserva, evento privado o consulta? Escríbenos por WhatsApp.
- **Email:** hola@lacasona.example.com

## Branding

| Token | Valor | Notas |
|-------|-------|-------|
| Color primario | `#5C3317` | Reemplaza `dark-blue` → `brand-dark` |
| Color acento | `#C0392B` | Reemplaza `terracotta` → `brand-accent` |
| Fondo | `#F5F0E8` | Similar a `cream`, más cálido |
| Fuente | Inter Variable | Patrón BONAE |

## Contacto

- WhatsApp: `584121234567`
- Mensaje predefinido: «Hola, quisiera reservar una mesa en La Casona»
- Email: hola@lacasona.example.com

## Componentes

| Acción | Componente |
|--------|------------|
| Crear | `Hero.astro`, `Menu.astro`, `Hours.astro`, `Contact.astro` |
| Adaptar | `Header.astro`, `Footer.astro`, `Layout.astro`, `WhatsAppFloat.astro` |
| Incluir | `CookieBanner.astro` (patrón BONAE) |

## Interactividad

- [x] Cookie banner (`<script is:inline>` + localStorage)

## SEO

- **title:** La Casona — Cocina criolla en Caracas
- **description:** Restaurante de cocina venezolana en Las Mercedes. Reserva tu mesa por WhatsApp.
- **theme-color:** `#5C3317`

## Criterios de aceptación

- [x] `npm run build --filter=cliente-ejemplo-restaurante` pasa
- [x] Una sola ruta `/` en español
- [x] WhatsApp funcional
- [x] Colores acordes al branding
- [x] Responsive mobile + desktop
