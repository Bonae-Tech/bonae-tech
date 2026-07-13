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

  it('reports business-hours title and daily schedule changes before publishing', () => {
    const published = loadPublished();
    const draft = structuredClone(published);
    draft.es.contact.hours.title = 'Horario especial';
    draft.es.contact.hours.days[0].open = '10:00';
    draft.es.contact.hours.days[6] = {
      day: 'sunday',
      closed: false,
      open: '10:00',
      close: '14:00',
    };

    const review = buildPublishReview({ draft, published });

    expect(review.validationErrors).toEqual([]);
    expect(review.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Horario › Título',
          kind: 'changed',
          before: 'Horario de atención',
          after: 'Horario especial',
        }),
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Horario › Lunes',
          kind: 'changed',
          before: '09:00–18:00',
          after: '10:00–18:00',
        }),
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Horario › Domingo',
          kind: 'changed',
          before: 'Cerrado',
          after: '10:00–14:00',
        }),
      ]),
    );
  });
});
