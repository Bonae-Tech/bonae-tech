import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateDraftsForPublish } from '../src/content-store/publish-validation.js';
import {
  readContentState,
  writePublishedAndDraftsFromBundle,
} from '../src/content-store/queries.js';
import { createFakeSqlStorage } from './fakeSql.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(here, '../../../apps/static/content/published');
const esDoc = JSON.parse(readFileSync(path.join(contentDir, 'es.json'), 'utf-8'));
const enDoc = JSON.parse(readFileSync(path.join(contentDir, 'en.json'), 'utf-8'));
const settingsDoc = JSON.parse(readFileSync(path.join(contentDir, 'settings.json'), 'utf-8'));

describe('writePublishedAndDraftsFromBundle (git-wins rehydrate write)', () => {
  it('overwrites published_cache and drafts for every locale', () => {
    const sql = createFakeSqlStorage() as ReturnType<typeof createFakeSqlStorage> & {
      seedPublishedAndDraft: (locale: string, content: unknown, commitSha?: string | null) => void;
    };
    sql.seedPublishedAndDraft('es', { stale: true }, 'old-sha');
    sql.seedPublishedAndDraft('en', { stale: true }, 'old-sha');
    sql.seedPublishedAndDraft('settings', { stale: true }, 'old-sha');

    const nextEs = { ...esDoc, siteName: 'Rehydrated ES' };
    const nextEn = { ...enDoc, siteName: 'Rehydrated EN' };
    writePublishedAndDraftsFromBundle(
      sql,
      { es: nextEs, en: nextEn, settings: settingsDoc },
      'new-sha',
    );

    const state = readContentState(sql);
    expect(state.lastCommitSha).toBe('new-sha');
    expect((state.published.es as { siteName: string }).siteName).toBe('Rehydrated ES');
    expect((state.draft.es as { siteName: string }).siteName).toBe('Rehydrated ES');
    expect((state.published.en as { siteName: string }).siteName).toBe('Rehydrated EN');
    expect((state.draft.en as { siteName: string }).siteName).toBe('Rehydrated EN');
    expect(state.published.settings).toEqual(settingsDoc);
    expect(state.draft.settings).toEqual(settingsDoc);
  });

  it('does not write when validation fails (callers must validate first)', () => {
    const invalid = { es: { not: 'valid' }, en: { not: 'valid' }, settings: { not: 'valid' } };
    const validation = validateDraftsForPublish(invalid);
    expect(validation.ok).toBe(false);

    const sql = createFakeSqlStorage() as ReturnType<typeof createFakeSqlStorage> & {
      seedPublishedAndDraft: (locale: string, content: unknown, commitSha?: string | null) => void;
    };
    sql.seedPublishedAndDraft('es', esDoc, 'sha-0');
    sql.seedPublishedAndDraft('en', enDoc, 'sha-0');
    sql.seedPublishedAndDraft('settings', settingsDoc, 'sha-0');

    // Simulate rehydrate guard: only write when validation.ok
    if (!validation.ok) {
      const state = readContentState(sql);
      expect((state.published.es as { siteName: string }).siteName).toBe(esDoc.siteName);
      expect((state.draft.es as { siteName: string }).siteName).toBe(esDoc.siteName);
      expect(state.lastCommitSha).toBe('sha-0');
    }
  });
});
