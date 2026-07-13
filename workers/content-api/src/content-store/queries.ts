import {
  CONTENT_LOCALES,
  contentSectionSchema,
  defaultPublishState,
  type ContentLocale,
  type ContentSection,
  type ContentStateResponse,
  type PublishState,
  type PublishStateValue,
} from '@bonae/content';

function parseJson(content: string): unknown {
  return JSON.parse(content) as unknown;
}

function readLocaleMap(
  sql: SqlStorage,
  table: 'drafts' | 'published_cache',
): Record<ContentLocale, unknown> {
  const result = { es: null, en: null, settings: null } as Record<ContentLocale, unknown>;
  for (const row of sql.exec(`SELECT locale, content FROM ${table}`)) {
    const locale = row.locale as ContentLocale;
    result[locale] = parseJson(row.content as string);
  }
  return result;
}

export function readContentState(sql: SqlStorage): ContentStateResponse {
  const draft = readLocaleMap(sql, 'drafts');
  const published = readLocaleMap(sql, 'published_cache');

  const cacheMeta = sql
    .exec('SELECT MAX(updated_at) AS last_published_at, MAX(commit_sha) AS last_commit_sha FROM published_cache')
    .one();

  return {
    draft,
    published,
    lastPublishedAt: (cacheMeta?.last_published_at as number | null) ?? null,
    lastCommitSha: (cacheMeta?.last_commit_sha as string | null) ?? null,
    publishState: readPublishState(sql),
  };
}

export function readPublishState(sql: SqlStorage): PublishState {
  const row = sql.exec('SELECT * FROM publish_state WHERE id = 1').one();
  if (!row) {
    return defaultPublishState();
  }
  return {
    state: row.state as PublishStateValue,
    commitSha: (row.commit_sha as string | null) ?? null,
    runUrl: (row.run_url as string | null) ?? null,
    startedAt: (row.started_at as number | null) ?? null,
    finishedAt: (row.finished_at as number | null) ?? null,
    error: (row.error as string | null) ?? null,
  };
}

export function saveDraftLocale(sql: SqlStorage, locale: ContentLocale, content: unknown): number {
  const now = Date.now();
  const serialized = JSON.stringify(content);
  sql.exec(
    `INSERT INTO drafts (locale, content, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(locale) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
    locale,
    serialized,
    now,
  );
  return now;
}

export function discardAllDrafts(sql: SqlStorage): void {
  const now = Date.now();
  for (const locale of CONTENT_LOCALES) {
    const row = sql.exec('SELECT content FROM published_cache WHERE locale = ?', locale).one();
    if (!row) {
      throw new Error(`Published cache missing locale: ${locale}`);
    }
    sql.exec(
      `INSERT INTO drafts (locale, content, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(locale) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
      locale,
      row.content as string,
      now,
    );
  }
}

export function discardSection(sql: SqlStorage, section: ContentSection): void {
  const now = Date.now();
  for (const locale of ['es', 'en'] as const) {
    const draftRow = sql.exec('SELECT content FROM drafts WHERE locale = ?', locale).one();
    const publishedRow = sql
      .exec('SELECT content FROM published_cache WHERE locale = ?', locale)
      .one();
    if (!draftRow || !publishedRow) {
      throw new Error(`Missing draft or published content for locale: ${locale}`);
    }

    const draftDoc = parseJson(draftRow.content as string) as Record<string, unknown>;
    const publishedDoc = parseJson(publishedRow.content as string) as Record<string, unknown>;
    if (!(section in publishedDoc)) {
      throw new Error(`Unknown section: ${section}`);
    }
    draftDoc[section] = publishedDoc[section];

    sql.exec(
      `INSERT INTO drafts (locale, content, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(locale) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
      locale,
      JSON.stringify(draftDoc),
      now,
    );
  }
}

export function parseDiscardSectionBody(body: unknown): ContentSection {
  if (typeof body !== 'object' || body === null || !('section' in body)) {
    throw new Error('Missing section in request body');
  }
  return contentSectionSchema.parse((body as { section: unknown }).section);
}

export function readDraftLocale(sql: SqlStorage, locale: ContentLocale): unknown {
  const row = sql.exec('SELECT content FROM drafts WHERE locale = ?', locale).one();
  if (!row) {
    throw new Error(`Draft not found for locale: ${locale}`);
  }
  return parseJson(row.content as string);
}

export function readDraftBundle(sql: SqlStorage): { es: unknown; en: unknown; settings: unknown } {
  return {
    es: readDraftLocale(sql, 'es'),
    en: readDraftLocale(sql, 'en'),
    settings: readDraftLocale(sql, 'settings'),
  };
}

export function writePublishState(
  sql: SqlStorage,
  state: PublishStateValue,
  fields: {
    commitSha?: string | null;
    runUrl?: string | null;
    startedAt?: number | null;
    finishedAt?: number | null;
    error?: string | null;
  } = {},
): void {
  const current = readPublishState(sql);
  sql.exec(
    `UPDATE publish_state
     SET state = ?, commit_sha = ?, run_url = ?, started_at = ?, finished_at = ?, error = ?
     WHERE id = 1`,
    state,
    fields.commitSha !== undefined ? fields.commitSha : current.commitSha,
    fields.runUrl !== undefined ? fields.runUrl : current.runUrl,
    fields.startedAt !== undefined ? fields.startedAt : current.startedAt,
    fields.finishedAt !== undefined ? fields.finishedAt : current.finishedAt,
    fields.error !== undefined ? fields.error : current.error,
  );
}

export function syncPublishedCacheFromDrafts(sql: SqlStorage, commitSha: string): void {
  const now = Date.now();
  for (const locale of CONTENT_LOCALES) {
    const row = sql.exec('SELECT content FROM drafts WHERE locale = ?', locale).one();
    if (!row) {
      throw new Error(`Draft missing for locale: ${locale}`);
    }
    sql.exec(
      `INSERT INTO published_cache (locale, content, commit_sha, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(locale) DO UPDATE SET
         content = excluded.content,
         commit_sha = excluded.commit_sha,
         updated_at = excluded.updated_at`,
      locale,
      row.content as string,
      commitSha,
      now,
    );
  }
}

/** Git wins: replace published_cache and drafts for every locale from a validated bundle. */
export function writePublishedAndDraftsFromBundle(
  sql: SqlStorage,
  bundle: { es: unknown; en: unknown; settings: unknown },
  commitSha: string | null,
): void {
  const now = Date.now();
  for (const locale of CONTENT_LOCALES) {
    const content = JSON.stringify(bundle[locale]);
    sql.exec(
      `INSERT INTO published_cache (locale, content, commit_sha, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(locale) DO UPDATE SET
         content = excluded.content,
         commit_sha = excluded.commit_sha,
         updated_at = excluded.updated_at`,
      locale,
      content,
      commitSha,
      now,
    );
    sql.exec(
      `INSERT INTO drafts (locale, content, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(locale) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
      locale,
      content,
      now,
    );
  }
}
