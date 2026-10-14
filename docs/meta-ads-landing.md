# Landing Meta Ads (`/meta/`)

Página de conversión para campañas en Facebook e Instagram, alineada con la marca de [bonaetech.com](https://bonaetech.com).

| URL | Idioma |
| --- | --- |
| `https://bonaetech.com/meta/` | Español |
| `https://bonaetech.com/en/meta/` | Inglés |

La ruta usa `noindex, nofollow` para no competir con el SEO del sitio principal. Los CTAs llevan a WhatsApp y a `#plantillas` en la web principal.

## Conectar con la web y Meta Ads

### 1. URL del anuncio en Meta

En **Meta Ads Manager**, en el anuncio o conjunto de anuncios, define la URL del sitio:

```text
https://bonaetech.com/meta/?utm_source=facebook&utm_medium=paid_social&utm_campaign=servicios_web&utm_content=video_a
```

Para Instagram, cambia `utm_source=instagram` o usa el mismo valor `meta` en campaña.

Parámetros útiles:

| Parámetro | Ejemplo | Uso |
| --- | --- | --- |
| `utm_source` | `facebook`, `instagram` | Origen del clic |
| `utm_medium` | `paid_social` | Canal |
| `utm_campaign` | `servicios_q4` | Nombre de campaña (se añade al mensaje de WhatsApp como `ref`) |
| `utm_content` | `carousel_plantillas` | Variante creativa |

El script en la landing lee `utm_campaign` o `utm_content` y lo agrega al texto prefijado de WhatsApp para identificar leads en el chat.

### 2. Enlace al sitio principal

Desde la landing:

- **Ver precios** → `https://bonaetech.com/#plantillas`
- **Sitio completo** → home

No hace falta duplicar contenido: la landing resume; el detalle de plantillas sigue en el index.

### 3. Meta Pixel (recomendado)

1. En [Meta Events Manager](https://business.facebook.com/events_manager), crea un **Pixel** o usa el existente.
2. En `apps/static/src/layouts/LandingLayout.astro`, descomenta el bloque del Pixel y sustituye `YOUR_PIXEL_ID`.
3. Eventos sugeridos:
   - **PageView** — automático al cargar.
   - **Lead** — opcional: dispara `fbq('track', 'Lead')` al hacer clic en enlaces `[data-meta-wa]` (puedes añadir un listener en el mismo script de la landing).

En Meta Ads, optimiza la campaña a **Conversiones → Landing Page View** o **Lead** según el evento que configures.

### 4. Dominio personalizado (opcional)

Si prefieres `https://promo.bonaetech.com` en lugar de `/meta/`:

**Opción A — Misma app Cloudflare Pages (recomendada)**

1. Cloudflare Dashboard → **Workers & Pages** → proyecto `bonae-tech` → **Custom domains**.
2. Añade `promo.bonaetech.com` (CNAME a Pages).
3. Crea una **Redirect Rule** o **Bulk Redirect**:
   - `promo.bonaetech.com` → `https://bonaetech.com/meta/` (302), conservando query string (`?utm_...`).

**Opción B — Subdominio directo**

Configura el dominio custom apuntando al mismo proyecto; la ruta sigue siendo `/meta/` en la URL pública a menos que uses un Worker delante que reescriba `/` → `/meta/`.

## Despliegue en Cloudflare

El sitio estático ya se publica en **Cloudflare Pages** (proyecto `bonae-tech`).

### Automático (producción)

Al hacer **merge a `main`**, el workflow [deploy-site.yml](../.github/workflows/deploy-site.yml) ejecuta:

1. `turbo run build validate:published --filter=bonae-static`
2. `wrangler pages deploy dist --project-name bonae-tech`

Tras el deploy, la landing queda en:

- `https://bonaetech.com/meta/`
- Preview de PR: URL temporal que genera Cloudflare en cada build de Pages (si está habilitado en el repo).

### Manual (local o emergencia)

Desde la raíz del monorepo:

```bash
npm ci
npm run build -- --filter=bonae-static
cd apps/static
npx wrangler pages deploy dist --project-name bonae-tech
```

Requiere `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (mismos secretos que CI).

### Verificar después del deploy

1. Abre `https://bonaetech.com/meta/?utm_campaign=test`
2. Pulsa WhatsApp y comprueba que el mensaje incluye `(ref: test)`.
3. Comprueba enlaces a `#plantillas` y cookie banner.

## Mantenimiento del copy

Los textos de la landing viven en `apps/static/src/lib/metaLanding.ts` (no en el CMS publicado). Cambios de precios destacados en la landing deben alinearse con `templateCategories.ts` y el JSON publicado.
