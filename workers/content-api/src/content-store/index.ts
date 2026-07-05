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
import { runMigrations } from './migrations.js';
import { handlePublishAlarm, handlePublishAbort, handlePublishCallback, handlePublishRequest } from './publish.js';
import {
  discardAllDrafts,
  discardSection,
  parseDiscardSectionBody,
  readContentState,
  readDraftLocale,
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

      if (request.method === 'POST' && path === '/publish') {
        const bodyText = await request.text();
        const payload = bodyText ? (JSON.parse(bodyText) as { actor?: string }) : {};
        const actor = payload.actor ?? 'unknown';
        const result = await handlePublishRequest(
          this.sql,
          this.env,
          actor,
          (at) => this.ctx.storage.setAlarm(at),
          () => this.ctx.storage.deleteAlarm(),
        );
        return this.json(result.status, result.body);
      }

      if (request.method === 'POST' && path === '/publish/callback') {
        const bodyText = await request.text();
        const result = await handlePublishCallback(
          this.sql,
          bodyText,
          () => this.ctx.storage.deleteAlarm(),
        );
        if (result.status === 204) {
          return new Response(null, { status: 204 });
        }
        return this.json(result.status, result.body);
      }

      if (request.method === 'POST' && path === '/publish/abort') {
        const result = await handlePublishAbort(this.sql, () => this.ctx.storage.deleteAlarm());
        return this.json(result.status, result.body);
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
    await handlePublishAlarm(this.sql);
  }

  private json(status: number, body: unknown): Response {
    if (body == null) {
      return new Response(null, { status });
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export type { ContentStateResponse };
