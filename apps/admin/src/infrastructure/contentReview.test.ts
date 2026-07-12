import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildPublishReview, reviewBlocksPublish } from './contentReview.js';

const publishedRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../static/content/published',
);

function loadPublished() {
  return {
    es: JSON.parse(readFileSync(path.join(publishedRoot, 'es.json'), 'utf8')),
    en: JSON.parse(readFileSync(path.join(publishedRoot, 'en.json'), 'utf8')),
    settings: JSON.parse(readFileSync(path.join(publishedRoot, 'settings.json'), 'utf8')),
  };
}

describe('buildPublishReview', () => {
  it('returns validation errors without throwing when a draft exceeds schema limits', () => {
    const published = loadPublished();
    const draft = structuredClone(published);
    draft.es.valueProp.items[3].description =
      'Deja atrás los procesos manuales y obsoletos. Diagnosticamos tu negocio para eliminar tareas repetitivas, automatizar tu operación diaria y adaptar tu empresa al reto de reducir errores.';

    const review = buildPublishReview({ draft, published });

    expect(review.validationErrors.length).toBeGreaterThan(0);
    expect(review.validationErrors.some((e) => e.startsWith('ES:'))).toBe(true);
    expect(reviewBlocksPublish(review)).toBe(true);
  });

  it('lists plans CTA field changes and warns when EN translations are unchanged', () => {
    const published = loadPublished();
    const draft = structuredClone(published);
    draft.es.plans.title = 'Nuevo título para el CTA';
    draft.es.plans.subtitle = 'Nuevo subtítulo para explicar la oferta';
    draft.es.plans.cta = 'Agendar llamada';

    const review = buildPublishReview({ draft, published });

    expect(review.validationErrors).toEqual([]);
    expect(reviewBlocksPublish(review)).toBe(false);
    expect(review.changeCount).toBe(3);
    expect(review.changes).toEqual([
      {
        locale: 'es',
        label: 'ES › CTA › Título',
        kind: 'changed',
        before: published.es.plans.title,
        after: draft.es.plans.title,
      },
      {
        locale: 'es',
        label: 'ES › CTA › Subtítulo',
        kind: 'changed',
        before: published.es.plans.subtitle,
        after: draft.es.plans.subtitle,
      },
      {
        locale: 'es',
        label: 'ES › CTA › Texto del botón',
        kind: 'changed',
        before: published.es.plans.cta,
        after: draft.es.plans.cta,
      },
    ]);
    expect(review.warnings).toEqual([
      { label: 'ES › CTA › Título', message: 'Falta traducción EN' },
      { label: 'ES › CTA › Subtítulo', message: 'Falta traducción EN' },
      { label: 'ES › CTA › Texto del botón', message: 'Falta traducción EN' },
    ]);
  });
});
