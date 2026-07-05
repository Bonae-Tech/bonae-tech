/**
 * Minimal in-memory stand-in for Cloudflare's SqlStorage, covering only the
 * specific query shapes used by content-store/queries.ts. This lets us test
 * the Durable Object's publish state machine locally without wrangler, a
 * real SQLite binding, or network access to GitHub.
 */
interface Cursor {
  one(): Record<string, unknown> | null;
  toArray(): Record<string, unknown>[];
  [Symbol.iterator](): Iterator<Record<string, unknown>>;
}

function cursor(rows: Record<string, unknown>[]): Cursor {
  return {
    one: () => rows[0] ?? null,
    toArray: () => rows,
    [Symbol.iterator]: () => rows[Symbol.iterator](),
  };
}

export function createFakeSqlStorage(): SqlStorage {
  const drafts = new Map<string, { content: string; updated_at: number }>();
  const publishedCache = new Map<string, { content: string; commit_sha: string | null; updated_at: number }>();
  let publishState: Record<string, unknown> = {
    id: 1,
    state: 'idle',
    commit_sha: null,
    run_url: null,
    started_at: null,
    finished_at: null,
    error: null,
  };

  const exec = (query: string, ...bindings: unknown[]): Cursor => {
    const q = query.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT * FROM publish_state')) {
      return cursor([{ ...publishState }]);
    }

    if (q.startsWith('UPDATE publish_state SET')) {
      const [state, commitSha, runUrl, startedAt, finishedAt, error] = bindings;
      publishState = {
        id: 1,
        state,
        commit_sha: commitSha,
        run_url: runUrl,
        started_at: startedAt,
        finished_at: finishedAt,
        error,
      };
      return cursor([]);
    }

    if (q.startsWith('SELECT content FROM drafts WHERE locale')) {
      const [locale] = bindings as [string];
      const row = drafts.get(locale);
      return cursor(row ? [{ content: row.content }] : []);
    }

    if (q.startsWith('SELECT locale, content FROM drafts')) {
      return cursor([...drafts.entries()].map(([locale, v]) => ({ locale, content: v.content })));
    }

    if (q.startsWith('INSERT INTO drafts')) {
      const [locale, content, updatedAt] = bindings as [string, string, number];
      drafts.set(locale, { content, updated_at: updatedAt });
      return cursor([]);
    }

    if (q.startsWith('SELECT content FROM published_cache WHERE locale')) {
      const [locale] = bindings as [string];
      const row = publishedCache.get(locale);
      return cursor(row ? [{ content: row.content }] : []);
    }

    if (q.startsWith('SELECT locale, content FROM published_cache')) {
      return cursor([...publishedCache.entries()].map(([locale, v]) => ({ locale, content: v.content })));
    }

    if (q.startsWith('SELECT COUNT(*) AS count FROM published_cache')) {
      return cursor([{ count: publishedCache.size }]);
    }

    if (q.startsWith('SELECT MAX(updated_at)')) {
      const rows = [...publishedCache.values()];
      const lastPublishedAt = rows.length ? Math.max(...rows.map((r) => r.updated_at)) : null;
      const lastCommitSha = rows.length ? rows[rows.length - 1].commit_sha : null;
      return cursor([{ last_published_at: lastPublishedAt, last_commit_sha: lastCommitSha }]);
    }

    if (q.startsWith('INSERT INTO published_cache')) {
      const [locale, content, commitSha, updatedAt] = bindings as [string, string, string | null, number];
      publishedCache.set(locale, { content, commit_sha: commitSha, updated_at: updatedAt });
      return cursor([]);
    }

    throw new Error(`fakeSql: unhandled query: ${q}`);
  };

  return {
    exec,
    seedPublishedAndDraft(locale: string, content: unknown, commitSha: string | null = null) {
      const serialized = JSON.stringify(content);
      const now = Date.now();
      publishedCache.set(locale, { content: serialized, commit_sha: commitSha, updated_at: now });
      drafts.set(locale, { content: serialized, updated_at: now });
    },
    setPublishState(fields: Partial<typeof publishState>) {
      publishState = { ...publishState, ...fields };
    },
    getPublishState() {
      return { ...publishState };
    },
  } as unknown as SqlStorage & {
    seedPublishedAndDraft: (locale: string, content: unknown, commitSha?: string | null) => void;
    setPublishState: (fields: Partial<typeof publishState>) => void;
    getPublishState: () => typeof publishState;
  };
}
