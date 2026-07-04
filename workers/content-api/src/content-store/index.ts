import {
  contentLocaleSchema,
  type ContentLocale,
  type ContentStateResponse,
  type DiscardResponse,
  type PublishStatusResponse,
  type SaveDraftResponse,
} from '@bonae/content';
import type { Env } from '../types.js';
import { bootstrapFromGitIfNeeded } from './bootstrap.js';
import { PUBLISH_ALARM_MS } from './constants.js';
import { runMigrations } from './migrations.js';
import {
  discardAllDrafts,
  discardSection,
  parseDiscardSectionBody,
  readDraftLocale,
  readContentState,
  readPublishState,
  saveDraftLocale,
} from './queries.js';

export class ContentStore implements DurableObject {
  private readonly sql: SqlStorage;

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: Env,
  ) {
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      runMigrations(this.sql);
      await bootstrapFromGitIfNeeded(this.sql, this.env);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      const draftMatch = path.match(/^\/drafts\/(es|en|settings)$/);

      if (request.method === 'GET' && path === '/state') {
        return this.json(200, readContentState(this.sql));
      }

      if (request.method === 'GET' && path === '/publish/status') {
        const publishState = readPublishState(this.sql);
        const body: PublishStatusResponse = {
          state: publishState.state,
          commitSha: publishState.commitSha,
          runUrl: publishState.runUrl,
          error: publishState.error,
        };
        return this.json(200, body);
      }

      if (request.method === 'GET' && draftMatch) {
        const locale = contentLocaleSchema.parse(draftMatch[1]) as ContentLocale;
        const content = readDraftLocale(this.sql, locale);
        return this.json(200, { locale, content, tier: 'drafts' });
      }

      if (request.method === 'PUT' && draftMatch) {
        const locale = contentLocaleSchema.parse(draftMatch[1]) as ContentLocale;
        const bodyText = await request.text();
        if (!bodyText) {
          return this.json(400, { error: 'Missing request body' });
        }
        const payload = JSON.parse(bodyText) as { content?: unknown };
        const content = payload.content ?? payload;
        const savedAt = saveDraftLocale(this.sql, locale, content);
        const response: SaveDraftResponse = { savedAt };
        return this.json(200, response);
      }

      if (request.method === 'POST' && path === '/drafts/discard') {
        discardAllDrafts(this.sql);
        const response: DiscardResponse = { discarded: true };
        return this.json(200, response);
      }

      if (request.method === 'POST' && path === '/drafts/discard-section') {
        const bodyText = await request.text();
        const body = bodyText ? (JSON.parse(bodyText) as unknown) : {};
        const section = parseDiscardSectionBody(body);
        discardSection(this.sql, section);
        const response: DiscardResponse = { discarded: true };
        return this.json(200, response);
      }

      return this.json(404, { error: 'Not found' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return this.json(400, { error: message });
    }
  }

  async alarm(): Promise<void> {
    const publishState = readPublishState(this.sql);
    if (publishState.state !== 'building' && publishState.state !== 'committing') {
      return;
    }
    const now = Date.now();
    this.sql.exec(
      `UPDATE publish_state
       SET state = 'failure', finished_at = ?, error = ?
       WHERE id = 1`,
      now,
      'Publish timed out waiting for deploy callback',
    );
  }

  /** Phase C will call this when publish starts. */
  schedulePublishAlarm(): void {
    this.ctx.storage.setAlarm(Date.now() + PUBLISH_ALARM_MS);
  }

  private json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export type { ContentStateResponse };
