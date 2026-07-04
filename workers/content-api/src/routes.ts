import type { AuthContext } from './auth/authorize.js';
import { requireAuthorized } from './auth/authorize.js';
import { contentStoreRequest } from './content-store/client.js';
import {
  createOctokit,
  parseGitHubConfig,
  publishDraftsToGit,
} from './github.js';
import { loadGitHubSecrets } from './secrets.js';
import type { Env } from './types.js';
import {
  assertLocaleParity,
  parseContentDocument,
  parseSiteSettings,
} from '@bonae/content';

type RouteResult = { status: number; body: unknown };

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
    throw new Error(error);
  }
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
    return forwardToStore(env, '/content/publish/status');
  }

  if (method === 'POST' && path === '/content/publish') {
    requireAuthorized(authContext, 'publish');
    const state = await contentStoreRequest<{
      draft: { es: unknown; en: unknown; settings: unknown };
    }>(env, '/state');
    const { draft } = state.body;
    assertLocaleParity(
      parseContentDocument(draft.es),
      parseContentDocument(draft.en),
    );
    parseSiteSettings(draft.settings);

    const secrets = loadGitHubSecrets(env);
    const config = parseGitHubConfig(secrets, env);
    const octokit = await createOctokit(config);
    const result = await publishDraftsToGit(octokit, config, draft, authContext.sub);
    console.log(JSON.stringify({ action: 'publish', actor: authContext.sub, commitSha: result.commitSha }));
    return { status: 200, body: { ok: true, commitSha: result.commitSha } };
  }

  throw new Error('Not found');
}
