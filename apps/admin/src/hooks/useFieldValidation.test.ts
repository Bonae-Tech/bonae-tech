import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import { describe, expect, it } from 'vitest';
import { useFieldValidation, type ValidationState } from './useFieldValidation.js';

const publishedRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../static/content/published',
);

function loadPublished(): { es: ContentDocument; en: ContentDocument; settings: SiteSettings } {
  return {
    es: JSON.parse(readFileSync(path.join(publishedRoot, 'es.json'), 'utf8')) as ContentDocument,
    en: JSON.parse(readFileSync(path.join(publishedRoot, 'en.json'), 'utf8')) as ContentDocument,
    settings: JSON.parse(readFileSync(path.join(publishedRoot, 'settings.json'), 'utf8')) as SiteSettings,
  };
}

function ValidationProbe({
  draftEs,
  draftEn,
  settings,
  onState,
}: {
  draftEs: ContentDocument;
  draftEn: ContentDocument;
  settings: SiteSettings;
  onState: (state: ValidationState) => void;
}) {
  onState(useFieldValidation(draftEs, draftEn, settings));
  return null;
}

function renderValidation(
  draftEs: ContentDocument,
  draftEn: ContentDocument,
  settings: SiteSettings,
): ValidationState {
  let state: ValidationState | undefined;

  renderToString(
    createElement(ValidationProbe, {
      draftEs,
      draftEn,
      settings,
      onState: (nextState) => {
        state = nextState;
      },
    }),
  );

  if (!state) {
    throw new Error('Validation hook did not render');
  }

  return state;
}

describe('useFieldValidation', () => {
  it('flags empty contact form labels and service options in the contact nav count', () => {
    const published = loadPublished();
    const draftEs = structuredClone(published.es);
    const draftEn = structuredClone(published.en);
    draftEs.contact.form.name = ' ';
    draftEs.contact.form.serviceOptions[2] = '';
    draftEn.contact.form.submit = '';

    const validation = renderValidation(draftEs, draftEn, published.settings);

    expect(validation.errorsEs.contact.formName).toBe('Nombre completo es obligatorio');
    expect(validation.errorsEs.contact['serviceOption.2']).toBe(
      'Opción de servicio 3 es obligatorio',
    );
    expect(validation.errorsEn.contact.formSubmit).toBe('Texto del botón es obligatorio');
    expect(validation.navErrorCount('contact')).toBe(3);
    expect(validation.hasGlobalErrors).toBe(true);
  });
});
