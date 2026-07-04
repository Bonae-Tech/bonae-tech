# Sección Planes → CTA de dos columnas — manual de cambio

La sección `#planes` dejó de ser un bloque centrado con badge "PLANES" y pasó a ser un **call to action en dos columnas**: copy a la izquierda y botón de WhatsApp a la derecha.

## Resumen visual

| Antes | Después |
|-------|---------|
| Badge "Planes" + título + subtítulo centrados | Sin badge |
| Nota inferior + 2 botones (WhatsApp + contacto) | Solo botón WhatsApp |
| Layout en una columna centrada | Grid 2 columnas (stack en móvil) |

**Columna izquierda:** `title` + `subtitle`  
**Columna derecha:** botón WhatsApp (`cta`) — mismo enlace que el resto del sitio vía `whatsappHref`

---

## Archivos modificados (7)

| # | Archivo | Qué cambió |
|---|---------|------------|
| 1 | `packages/content/src/schema.ts` | Esquema `plans` reducido a `title`, `subtitle`, `cta` (eliminados `sectionBadge`, `ctaSub`, `note`) |
| 2 | `apps/static/src/components/Plans.astro` | Layout 2 columnas; sin badge; un solo botón WhatsApp |
| 3 | `apps/static/content/published/es.json` | Copy ES + `cta`: "Cotiza Ahora" |
| 4 | `apps/static/content/published/en.json` | Copy EN traducido |
| 5 | `apps/static/content/drafts/es.json` | Igual que published (admin mock) |
| 6 | `apps/static/content/drafts/en.json` | Igual que published (admin mock) |
| 7 | `docs/plans-cta-manual.md` | Este manual |

**No se modificaron:** `index.astro`, `en/index.astro`, Header, Footer, admin forms (Planes solo se edita vía **Advanced JSON** en el admin).

---

## Campos JSON (`plans`)

```json
"plans": {
  "title": "¿Listo para digitalizar y automatizar tu marca?",
  "subtitle": "El impulso tecnológico que tu empresa necesita está a solo un clic de distancia. Obtén un presupuesto personalizado hoy mismo.",
  "cta": "Cotiza Ahora"
}
```

| Campo | Uso |
|-------|-----|
| `title` | Título columna izquierda (h2) |
| `subtitle` | Párrafo bajo el título |
| `cta` | Texto del botón WhatsApp |

El enlace del botón **no** va en JSON: se genera con `whatsappHrefFor(t)` desde `settings.json` (`whatsappNumber` + mensaje de contacto).

---

## Cómo editar el contenido

### Admin mock
```bash
npm run admin:dev:mock
```
1. **Advanced JSON** → busca el objeto `"plans"`.
2. Edita `title`, `subtitle`, `cta` en ES y EN.
3. Guarda draft en ambos idiomas → **Publish site**.

### JSON directo
- Borradores: `apps/static/content/drafts/es.json` y `en.json`
- Sitio en build: `apps/static/content/published/es.json` y `en.json`

---

## Diseño actual (CTA coral con degradado)

Degradado horizontal suave, sin banda sólida:

| Parada | Color | Rol |
|--------|-------|-----|
| 0%–58% | `#FF6F61` | Coral sólido (zona de texto) |
| 78% | `#FF8276` | Transición |
| 90% | `#FF8A7E` | Transición |
| 100% | `#FF9185` | Tono final |

Dos columnas asimétricas en desktop (`1.35fr / 0.65fr`). El copy ocupa todo el ancho de la columna izquierda.

Estilos en `apps/static/src/styles/global.css` (clases `.plans-cta*`).

---

## Cómo editar el diseño

| Qué | Dónde |
|-----|--------|
| Estructura 2 columnas | `apps/static/src/components/Plans.astro` + `.plans-cta-inner` en `global.css` |
| Degradado y tipografía CTA | Clases `.plans-cta*` en `apps/static/src/styles/global.css` |
| Validación de campos | `packages/content/src/schema.ts` — objeto `plans` |

Tras cambiar el esquema:
```bash
npm run content:build
npm run content:validate:drafts
```

---

## Probar en local

```bash
npm run dev
```
Abre http://localhost:4321/ y baja a la sección `#planes` (antes del contacto).

Si no ves los cambios de estilo:

1. Detén el servidor (`Ctrl+C`) y vuelve a ejecutar `npm run dev`.
2. Confirma que la URL es **http://localhost:4321/** (no el sitio desplegado en producción).
3. Hard reload: **Ctrl + Shift + R** (o vacía caché del navegador).
4. Alternativa directa sin Turbo: `npm run dev -w bonae-static`.

---

## Revertir o ampliar

- **Segundo botón** (p. ej. enlace a `#contacto`): añade campo en schema + JSON + markup en `Plans.astro`.
- **Badge de sección**: añade `sectionBadge` al schema y un `<span>` en la columna izquierda (como en ValueProp).
