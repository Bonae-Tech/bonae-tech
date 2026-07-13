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

  it('reports contact form label edits and service option add/remove changes', () => {
    const published = loadPublished();
    const draft = structuredClone(published);
    draft.es.contact.form.name = 'Nombre y apellido';
    draft.es.contact.form.serviceOptions[0] = 'Landing page';
    draft.es.contact.form.serviceOptions.push('Automatización');
    draft.en.contact.form.serviceOptions = draft.en.contact.form.serviceOptions.slice(0, -1);

    const review = buildPublishReview({ draft, published });

    expect(review.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Formulario › Nombre completo',
          kind: 'changed',
          before: 'Nombre completo',
          after: 'Nombre y apellido',
        }),
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Opción de servicio › 1',
          kind: 'changed',
          before: 'Sitio web',
          after: 'Landing page',
        }),
        expect.objectContaining({
          locale: 'es',
          label: 'ES › Contacto › Opción de servicio › 6',
          kind: 'added',
          after: 'Automatización',
        }),
        expect.objectContaining({
          locale: 'en',
          label: 'EN › Contacto › Opción de servicio › 5',
          kind: 'removed',
          before: 'Other',
        }),
      ]),
    );
    expect(review.warnings).toContainEqual({
      label: 'contact.form.serviceOptions',
      message: 'Array length mismatch for contact.form.serviceOptions: es=6, en=4',
    });
  });
});
