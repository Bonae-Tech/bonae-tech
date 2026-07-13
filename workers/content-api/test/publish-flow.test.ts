import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../src/types.js';
import { createFakeSqlStorage } from './fakeSql.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(here, '../../../apps/static/content/published');
const esDoc = JSON.parse(readFileSync(path.join(contentDir, 'es.json'), 'utf-8'));
const enDoc = JSON.parse(readFileSync(path.join(contentDir, 'en.json'), 'utf-8'));
const settingsDoc = JSON.parse(readFileSync(path.join(contentDir, 'settings.json'), 'utf-8'));

const rehydrateFromGit = vi.fn();

vi.mock('../src/content-store/bootstrap.js', () => ({
  rehydrateFromGit: (...args: unknown[]) => rehydrateFromGit(...args),
  bootstrapFromGitIfNeeded: vi.fn(),
}));

const {
  handlePublishAbort,
  handlePublishAlarm,
  handlePublishCallback,
  handlePublishRequest,
} = await import('../src/content-store/publish.js');

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

    expect(result.status).toBe(500);
    expect(sql.getPublishState().state).toBe('failure');
    expect(scheduleAlarm).toHaveBeenCalledTimes(1);
    expect(clearAlarm).toHaveBeenCalledTimes(1);
  });
});

describe('handlePublishCallback', () => {
  let sql: ReturnType<typeof makeSql>;

  beforeEach(() => {
    sql = makeSql();
    sql.setPublishState({ state: 'building', commit_sha: 'sha-123' });
    rehydrateFromGit.mockReset();
    rehydrateFromGit.mockResolvedValue({ ok: true });
  });

  it('applies a matching success callback, rehydrates from git, and clears the alarm', async () => {
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      noSecretsEnv,
      JSON.stringify({ commitSha: 'sha-123', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(rehydrateFromGit).toHaveBeenCalledWith(sql, noSecretsEnv, { commitSha: 'sha-123' });
    expect(clearAlarm).toHaveBeenCalledTimes(1);
    expect(sql.getPublishState().state).toBe('success');
  });

  it('applies a matching failure callback without rehydrate', async () => {
    const clearAlarm = vi.fn(async () => {});
    await handlePublishCallback(
      sql,
      noSecretsEnv,
      JSON.stringify({ commitSha: 'sha-123', status: 'failure', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(rehydrateFromGit).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('failure');
    expect(clearAlarm).toHaveBeenCalledTimes(1);
  });

  it('rehydrates on success even when commitSha does not match in-flight publish', async () => {
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      noSecretsEnv,
      JSON.stringify({ commitSha: 'sha-999', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(rehydrateFromGit).toHaveBeenCalledWith(sql, noSecretsEnv, { commitSha: 'sha-999' });
    expect(clearAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('building');
  });

  it('rehydrates on success when no publish is in flight (git-ahead direct deploy)', async () => {
    sql.setPublishState({ state: 'idle', commit_sha: null });
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      noSecretsEnv,
      JSON.stringify({ commitSha: 'sha-direct', status: 'success', runUrl: 'https://ci/run/2' }),
      clearAlarm,
    );
    expect(result.status).toBe(204);
    expect(rehydrateFromGit).toHaveBeenCalledWith(sql, noSecretsEnv, { commitSha: 'sha-direct' });
    expect(clearAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('idle');
  });

  it('returns 500 and does not settle publish state when rehydrate fails', async () => {
    rehydrateFromGit.mockResolvedValue({ ok: false, error: 'invalid published content' });
    const clearAlarm = vi.fn(async () => {});
    const result = await handlePublishCallback(
      sql,
      noSecretsEnv,
      JSON.stringify({ commitSha: 'sha-123', status: 'success', runUrl: 'https://ci/run/1' }),
      clearAlarm,
    );
    expect(result.status).toBe(500);
    expect(clearAlarm).not.toHaveBeenCalled();
    expect(sql.getPublishState().state).toBe('building');
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
