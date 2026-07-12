import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import { describe, expect, it } from 'vitest';
import { getLocaleFieldError, useFieldValidation, type ValidationState } from './useFieldValidation.js';

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

function renderValidation(
  es: ContentDocument,
  en: ContentDocument,
  settings: SiteSettings,
): ValidationState {
  let state: ValidationState | null = null;

  function Probe() {
    state = useFieldValidation(es, en, settings);
    return null;
  }

  renderToStaticMarkup(createElement(Probe));

  if (!state) {
    throw new Error('Validation probe did not render');
  }

  return state;
}

describe('useFieldValidation', () => {
  it('validates plans CTA fields and includes them in section error counts', () => {
    const { es, en, settings } = loadPublished();
    const draftEs = structuredClone(es);
    const draftEn = structuredClone(en);
    draftEs.plans.title = ' ';
    draftEs.plans.subtitle = 'x'.repeat(241);
    draftEs.plans.cta = 'x'.repeat(41);
    draftEn.plans.cta = '';

    const state = renderValidation(draftEs, draftEn, settings);

    expect(state.errorsEs.plans).toEqual({
      title: 'Título es obligatorio',
      subtitle: 'Subtítulo es demasiado largo (241/240)',
      cta: 'Texto del botón es demasiado largo (41/40)',
    });
    expect(state.errorsEn.plans.cta).toBe('Texto del botón es obligatorio');
    expect(getLocaleFieldError(state.errorsEs, 'plans', 'cta')).toBe(
      'Texto del botón es demasiado largo (41/40)',
    );
    expect(state.navErrorCount('plans')).toBe(4);
    expect(state.hasGlobalErrors).toBe(true);
  });
});
