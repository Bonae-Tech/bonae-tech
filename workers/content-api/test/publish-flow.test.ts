import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handlePublishAbort,
  handlePublishAlarm,
  handlePublishCallback,
  handlePublishRequest,
} from '../src/content-store/publish.js';
import { createFakeSqlStorage } from './fakeSql.js';
import type { Env } from '../src/types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(here, '../../../apps/static/content/published');
const esDoc = JSON.parse(readFileSync(path.join(contentDir, 'es.json'), 'utf-8'));
const enDoc = JSON.parse(readFileSync(path.join(contentDir, 'en.json'), 'utf-8'));
const settingsDoc = JSON.parse(readFileSync(path.join(contentDir, 'settings.json'), 'utf-8'));

/** Env with no GitHub secrets configured — forces handlePublishRequest into its failure path
 * deterministically, without any network access, once past the validation guard. */
const noSecretsEnv = {} as Env;

function makeSql() {
  const sql = createFakeSqlStorage() as ReturnType<typeof createFakeSqlStorage> & {
    seedPublishedAndDraft: (locale: string, content: unknown, commitSha?: string | null) => void;
    setPublishState: (fields: Record<string, unknown>) => void;
    getPublishState: () => Record<string, unknown>;
  };
  sql.seedPublishedAndDraft('es', esDoc, 'sha-0');
  sql.seedPublishedAndDraft('en', enDoc, 'sha-0');
  sql.seedPublishedAndDraft('settings', settingsDoc, 'sha-0');
  return sql;
}

describe('handlePublishRequest guards', () => {
  it('rejects a new publish with 409 while one is already in flight (committing)', async () => {
    const sql = makeSql();
    sql.setPublishState({ state: 'committing' });
    const scheduleAlarm = vi.fn();
    const clearAlarm = vi.fn(async () => {});

    const result = await handlePublishRequest(sql, noSecretsEnv, 'actor-1', scheduleAlarm, clearAlarm);

    expect(result.status).toBe(409);
    expect(scheduleAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('committing');
  });

  it('rejects a new publish with 409 while one is already in flight (building)', async () => {
    const sql = makeSql();
    sql.setPublishState({ state: 'building' });
    const result = await handlePublishRequest(sql, noSecretsEnv, 'actor-1', vi.fn(), vi.fn(async () => {}));
    expect(result.status).toBe(409);
  });

  it('rejects invalid drafts with 422 and never touches publish state', async () => {
    const sql = createFakeSqlStorage() as ReturnType<typeof createFakeSqlStorage> & {
      seedPublishedAndDraft: (locale: string, content: unknown, commitSha?: string | null) => void;
      getPublishState: () => Record<string, unknown>;
    };
    // Drafts present but structurally invalid — validation must fail cleanly
    // with a 422 rather than writing any publish state.
    sql.seedPublishedAndDraft('es', { not: 'a valid document' });
    sql.seedPublishedAndDraft('en', { not: 'a valid document' });
    sql.seedPublishedAndDraft('settings', { not: 'valid settings' });
    const scheduleAlarm = vi.fn();

    const result = await handlePublishRequest(sql, noSecretsEnv, 'actor-1', scheduleAlarm, vi.fn(async () => {}));

    expect(result.status).toBe(422);
    expect(scheduleAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('idle');
  });

  it('schedules the timeout alarm immediately when entering "committing", before any GitHub call', async () => {
    const sql = makeSql();
    const scheduleAlarm = vi.fn();
    const clearAlarm = vi.fn(async () => {});

    const result = await handlePublishRequest(sql, noSecretsEnv, 'actor-1', scheduleAlarm, clearAlarm);

    // No GitHub secrets configured -> commit fails -> state settles to 'failure'.
    expect(result.status).toBe(500);
    expect(sql.getPublishState().state).toBe('failure');
    // The alarm must have been scheduled (safety net) even though the commit
    // ultimately failed, and cleared once the failure was recorded.
    expect(scheduleAlarm).toHaveBeenCalledTimes(1);
    expect(clearAlarm).toHaveBeenCalledTimes(1);
  });
});

describe('handlePublishCallback', () => {
  let sql: ReturnType<typeof makeSql>;

  beforeEach(() => {
    sql = makeSql();
    sql.setPublishState({ state: 'building', commit_sha: 'sha-123' });
  });

  it('applies a matching success callback and clears the alarm', async () => {
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      JSON.stringify({ commitSha: 'sha-123', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(clearAlarm).toHaveBeenCalledTimes(1);
    expect(sql.getPublishState().state).toBe('success');
  });

  it('applies a matching failure callback', async () => {
    const clearAlarm = vi.fn(async () => {});
    await handlePublishCallback(
      sql,
      JSON.stringify({ commitSha: 'sha-123', status: 'failure', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(sql.getPublishState().state).toBe('failure');
    expect(clearAlarm).toHaveBeenCalledTimes(1);
  });

  it('ignores a callback for a commitSha that does not match (stale/duplicate CI run)', async () => {
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      JSON.stringify({ commitSha: 'sha-999', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(clearAlarm).not.toHaveBeenCalled();
    // State must remain untouched — a stray/duplicate callback can never
    // resurrect or corrupt an unrelated publish.
    expect(sql.getPublishState().state).toBe('building');
  });

  it('ignores a callback when no publish is in flight (state is idle)', async () => {
    sql.setPublishState({ state: 'idle', commit_sha: null });
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      JSON.stringify({ commitSha: 'sha-123', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(clearAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('idle');
  });
});

describe('handlePublishAlarm', () => {
  it('fails an in-flight publish that timed out waiting for a callback', async () => {
    const sql = makeSql();
    sql.setPublishState({ state: 'building' });
    await handlePublishAlarm(sql);
    expect(sql.getPublishState().state).toBe('failure');
    expect(sql.getPublishState().error).toMatch(/timed out/i);
  });

  it('is a no-op if the state already left the in-flight set (guards against a stray alarm firing twice)', async () => {
    const sql = makeSql();
    sql.setPublishState({ state: 'success' });
    await handlePublishAlarm(sql);
    expect(sql.getPublishState().state).toBe('success');
  });
});

describe('handlePublishAbort', () => {
  it('force-fails an in-flight publish and clears the alarm', async () => {
    const sql = makeSql();
    sql.setPublishState({ state: 'building' });
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishAbort(sql, clearAlarm);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ aborted: true, state: 'failure' });
    expect(clearAlarm).toHaveBeenCalledTimes(1);
    expect(sql.getPublishState().state).toBe('failure');
  });

  it('is idempotent — repeated aborts on an already-idle store never error or loop', async () => {
    const sql = makeSql();
    const clearAlarm = vi.fn(async () => {});
    const first = await handlePublishAbort(sql, clearAlarm);
    const second = await handlePublishAbort(sql, clearAlarm);
    expect(first.body).toEqual({ aborted: false, state: 'idle' });
    expect(second.body).toEqual({ aborted: false, state: 'idle' });
    expect(clearAlarm).toHaveBeenCalledTimes(2);
  });
});
