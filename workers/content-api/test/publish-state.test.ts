import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultPublishState } from '@bonae/content';
import {
  callbackFailureMessage,
  evaluatePublishCallback,
  shouldTimeoutPublish,
} from '../src/content-store/publish-state.js';
import { validateDraftsForPublish } from '../src/content-store/publish-validation.js';

const publishedDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/static/content/published',
);

function loadPublished(name: string): unknown {
  return JSON.parse(readFileSync(join(publishedDir, name), 'utf8')) as unknown;
}

const publishedEs = loadPublished('es.json');
const publishedEn = loadPublished('en.json');
const publishedSettings = loadPublished('settings.json');

describe('validateDraftsForPublish', () => {
  it('accepts valid drafts', () => {
    const result = validateDraftsForPublish({
      es: publishedEs,
      en: publishedEn,
      settings: publishedSettings,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects invalid locale documents', () => {
    const result = validateDraftsForPublish({
      es: { ...(publishedEs as Record<string, unknown>), lang: 'en' },
      en: publishedEn,
      settings: publishedSettings,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('lang'))).toBe(true);
    }
  });

  it('rejects parity mismatch', () => {
    const en = publishedEn as Record<string, unknown>;
    const valueProp = en.valueProp as Record<string, unknown>;
    const result = validateDraftsForPublish({
      es: publishedEs,
      en: { ...en, valueProp: { ...valueProp, items: [] } },
      settings: publishedSettings,
    });
    expect(result.ok).toBe(false);
  });
});

describe('evaluatePublishCallback', () => {
  const building = {
    ...defaultPublishState(),
    state: 'building' as const,
    commitSha: 'abc123',
  };

  it('applies success when sha matches', () => {
    expect(
      evaluatePublishCallback(building, {
        commitSha: 'abc123',
        status: 'success',
        runUrl: 'https://github.com/runs/1',
      }),
    ).toEqual({ kind: 'applied', success: true });
  });

  it('ignores when state is not building', () => {
    expect(
      evaluatePublishCallback(defaultPublishState(), {
        commitSha: 'abc123',
        status: 'success',
        runUrl: 'https://github.com/runs/1',
      }),
    ).toEqual({ kind: 'ignored', reason: 'wrong_state' });
  });

  it('ignores sha mismatch', () => {
    expect(
      evaluatePublishCallback(building, {
        commitSha: 'other',
        status: 'success',
        runUrl: 'https://github.com/runs/1',
      }),
    ).toEqual({ kind: 'ignored', reason: 'sha_mismatch' });
  });
});

describe('callbackFailureMessage', () => {
  it('describes cancelled runs', () => {
    expect(
      callbackFailureMessage({
        commitSha: 'x',
        status: 'cancelled',
        runUrl: 'https://github.com/runs/1',
      }),
    ).toContain('cancelled');
  });
});

describe('shouldTimeoutPublish', () => {
  it('only times out in-flight states', () => {
    expect(shouldTimeoutPublish('building')).toBe(true);
    expect(shouldTimeoutPublish('committing')).toBe(true);
    expect(shouldTimeoutPublish('idle')).toBe(false);
    expect(shouldTimeoutPublish('success')).toBe(false);
  });
});
