import type { AuthContext } from './auth/authorize.js';
import { requireAuthorized } from './auth/authorize.js';
import { contentStoreRequest } from './content-store/client.js';
import { createRateLimiter } from './rate-limiter.js';
import type { Env } from './types.js';

type RouteResult = { status: number; body: unknown };

/**
 * Guard against any client-side bug turning status polling into a runaway
 * loop: the healthy client polls ~1x/3s per user, so 20 requests / 10s per
 * user leaves generous headroom while still capping worst-case load on the
 * Durable Object several orders of magnitude below an unbounded loop.
 */
const publishStatusLimiter = createRateLimiter(20, 10_000);

function storePath(workerPath: string): string {
  return workerPath.replace(/^\/content/, '') || '/';
}

async function forwardToStore(
  env: Env,
  workerPath: string,
  init?: RequestInit,
): Promise<RouteResult> {
  const { status, body } = await contentStoreRequest<Record<string, unknown>>(
    env,
    storePath(workerPath),
    init,
  );
  if (status >= 400) {
    const error = typeof body.error === 'string' ? body.error : 'Request failed';
    if (status === 409) {
      throw new Error(`Conflict: ${error}`);
    }
    if (status === 422 && Array.isArray(body.errors)) {
      throw new Error(`Validation failed: ${(body.errors as string[]).join('; ')}`);
    }
    throw new Error(error);
  }
  return { status, body };
}

export async function handlePublishCallbackRequest(
  request: Request,
  env: Env,
): Promise<RouteResult> {
  const bodyText = await request.text();
  const { status, body } = await contentStoreRequest<null>(env, '/publish/callback', {
    method: 'POST',
    body: bodyText,
    headers: { 'Content-Type': 'application/json' },
  });
  return { status, body };
}

export async function handleContentRequest(
  request: Request,
  env: Env,
  authContext: AuthContext,
): Promise<RouteResult> {
  const method = request.method;
  const path = new URL(request.url).pathname;

  if (method === 'GET' && path === '/content/state') {
    requireAuthorized(authContext, 'read_draft');
    return forwardToStore(env, path);
  }

  const draftMatch = path.match(/^\/content\/drafts\/(es|en|settings)$/);
  const publishedMatch = path.match(/^\/content\/published\/(es|en|settings)$/);

  if (method === 'GET' && draftMatch) {
    requireAuthorized(authContext, 'read_draft');
    return forwardToStore(env, path);
  }

  if (method === 'GET' && publishedMatch) {
    requireAuthorized(authContext, 'read_published');
    const state = await contentStoreRequest<{
      published: Record<string, unknown>;
    }>(env, '/state');
    const resource = publishedMatch[1] as 'es' | 'en' | 'settings';
    return {
      status: 200,
      body: {
        locale: resource,
        content: state.body.published[resource],
        tier: 'published',
      },
    };
  }

  if (method === 'PUT' && draftMatch) {
    requireAuthorized(authContext, 'write_draft');
    const resource = draftMatch[1] as 'es' | 'en' | 'settings';
    const bodyText = await request.text();
    const storeResult = await forwardToStore(env, path, {
      method: 'PUT',
      body: bodyText,
      headers: { 'Content-Type': 'application/json' },
    });
    const payload = bodyText ? (JSON.parse(bodyText) as { content?: unknown }) : {};
    const content = payload.content ?? payload;
    const savedAt =
      typeof (storeResult.body as { savedAt?: number }).savedAt === 'number'
        ? (storeResult.body as { savedAt: number }).savedAt
        : Date.now();
    console.log(
      JSON.stringify({ action: 'save_draft', resource, actor: authContext.sub, savedAt }),
    );
    return {
      status: 200,
      body: {
        locale: resource,
        content,
        tier: 'drafts',
        savedAt,
      },
    };
  }

  if (method === 'POST' && path === '/content/drafts/discard') {
    requireAuthorized(authContext, 'write_draft');
    return forwardToStore(env, path, { method: 'POST', body: '{}' });
  }

  if (method === 'POST' && path === '/content/drafts/discard-section') {
    requireAuthorized(authContext, 'write_draft');
    const bodyText = await request.text();
    return forwardToStore(env, path, {
      method: 'POST',
      body: bodyText,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (method === 'GET' && path === '/content/publish/status') {
    requireAuthorized(authContext, 'read_draft');
    if (!publishStatusLimiter.isAllowed(authContext.sub)) {
      console.warn(JSON.stringify({ action: 'publish_status_rate_limited', actor: authContext.sub }));
      return { status: 429, body: { error: 'Too many status checks. Slow down and try again shortly.' } };
    }
    return forwardToStore(env, '/content/publish/status');
  }

  if (method === 'POST' && path === '/content/publish') {
    requireAuthorized(authContext, 'publish');
    const { status, body } = await contentStoreRequest<Record<string, unknown>>(env, '/publish', {
      method: 'POST',
      body: JSON.stringify({ actor: authContext.sub }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (status === 409) {
      throw new Error('Conflict: Publish already in flight');
    }
    if (status === 422) {
      return { status: 422, body };
    }
    if (status >= 400) {
      const error = typeof body.error === 'string' ? body.error : 'Publish failed';
      throw new Error(error);
    }
    return { status, body };
  }

  if (method === 'POST' && path === '/content/publish/abort') {
    requireAuthorized(authContext, 'publish');
    return forwardToStore(env, '/content/publish/abort', { method: 'POST', body: '{}' });
  }

  throw new Error('Not found');
}
