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
  it('reports DatosClave changes with localized labels and missing EN warnings', () => {
    const published = loadPublished();
    const draft = structuredClone(published);
    draft.es.keyFigures.years = '35+';
    draft.settings.socialLinks.instagram = 'https://instagram.com/bonaetech';

    const review = buildPublishReview({ draft, published });

    expect(review.changes).toEqual(
      expect.arrayContaining([
        {
          locale: 'es',
          label: 'ES › DatosClave › Valor de años',
          kind: 'changed',
          before: '30+',
          after: '35+',
        },
        {
          locale: 'settings',
          label: 'Configuración › Redes sociales › Instagram',
          kind: 'changed',
          before: '',
          after: 'https://instagram.com/bonaetech',
        },
      ]),
    );
    expect(review.changeCount).toBe(2);
    expect(review.warnings).toEqual(
      expect.arrayContaining([
        {
          label: 'ES › DatosClave › Valor de años',
          message: 'Falta traducción EN',
        },
      ]),
    );
    expect(review.validationErrors).toEqual([]);
    expect(reviewBlocksPublish(review)).toBe(false);
  });

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
});
