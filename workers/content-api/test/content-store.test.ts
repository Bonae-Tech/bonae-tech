import { describe, expect, it } from 'vitest';
import { defaultPublishState, isPublishInFlight } from '@bonae/content';
import { SQL_MIGRATIONS, getAppliedMigrationVersions } from '../src/content-store/migrations.js';
import { parseDiscardSectionBody } from '../src/content-store/queries.js';

describe('SQL_MIGRATIONS', () => {
  it('has unique ascending version numbers', () => {
    const versions = SQL_MIGRATIONS.map((m) => m.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('creates core tables in migration 1', () => {
    const sql = SQL_MIGRATIONS.find((m) => m.version === 1)?.statements.join('\n') ?? '';
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS drafts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS published_cache');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS publish_state');
  });
});

describe('getAppliedMigrationVersions', () => {
  it('returns empty set when no migrations applied', () => {
    const sql = {
      exec: (query: string) => {
        if (query.includes('_sql_schema_migrations')) {
          return { toArray: () => [], one: () => null, [Symbol.iterator]: function* () {} };
        }
        return { toArray: () => [], one: () => null, [Symbol.iterator]: function* () {} };
      },
    } as unknown as SqlStorage;

    expect(getAppliedMigrationVersions(sql)).toEqual(new Set());
  });
});

describe('parseDiscardSectionBody', () => {
  it('parses a valid section', () => {
    expect(parseDiscardSectionBody({ section: 'hero' })).toBe('hero');
  });

  it('rejects missing section', () => {
    expect(() => parseDiscardSectionBody({})).toThrow('Missing section');
  });
});

describe('publish state helpers', () => {
  it('detects in-flight states', () => {
    expect(isPublishInFlight('committing')).toBe(true);
    expect(isPublishInFlight('building')).toBe(true);
    expect(isPublishInFlight('idle')).toBe(false);
    expect(isPublishInFlight(defaultPublishState().state)).toBe(false);
  });
});
