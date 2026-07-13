import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseContentDocument, parseSiteSettings, type ContentDocument, type SiteSettings } from '@bonae/content/schema';
import { useFieldValidation, type ValidationState } from './useFieldValidation.js';

const publishedRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../static/content/published',
);

function loadPublished(): { es: ContentDocument; en: ContentDocument; settings: SiteSettings } {
  return {
    es: parseContentDocument(JSON.parse(readFileSync(path.join(publishedRoot, 'es.json'), 'utf8'))),
    en: parseContentDocument(JSON.parse(readFileSync(path.join(publishedRoot, 'en.json'), 'utf8'))),
    settings: parseSiteSettings(JSON.parse(readFileSync(path.join(publishedRoot, 'settings.json'), 'utf8'))),
  };
}

function renderValidation(
  draftEs: ContentDocument,
  draftEn: ContentDocument,
  settings: SiteSettings,
): ValidationState {
  let validation: ValidationState | undefined;

  function Probe() {
    validation = useFieldValidation(draftEs, draftEn, settings);
    return createElement('div');
  }

  renderToStaticMarkup(createElement(Probe));

  if (!validation) {
    throw new Error('Validation probe did not render');
  }
  return validation;
}

describe('useFieldValidation', () => {
  it('flags open business days that are missing opening or closing times', () => {
    const published = loadPublished();
    const draftEs = structuredClone(published.es);
    draftEs.contact.hours.days[4] = {
      ...draftEs.contact.hours.days[4],
      close: '',
    };

    const validation = renderValidation(draftEs, published.en, published.settings);

    expect(validation.settingsErrors.hours).toBe('Completa apertura y cierre en los días abiertos');
    expect(validation.navErrorCount('settings')).toBe(1);
    expect(validation.hasGlobalErrors).toBe(true);
  });
});
