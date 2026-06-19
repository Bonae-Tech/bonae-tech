import {
  parseContentDocument,
  parseSiteSettings,
  assertLocaleParity,
  type Locale,
} from '@bonae/content';
import type { AuthContext } from './auth/authorize.js';
import { requireAuthorized } from './auth/authorize.js';
import {
  createOctokit,
  parseGitHubConfig,
  publishContent,
  readRepoJson,
  writeRepoJson,
} from './github.js';
import { loadGitHubSecrets } from './secrets.js';
import type { Env } from './types.js';

type ResourceKey = Locale | 'settings';

function parseResource(raw: string | undefined): ResourceKey {
  if (raw === 'es' || raw === 'en' || raw === 'settings') return raw;
  throw new Error('Invalid locale. Use es, en, or settings');
}

function fileNameFor(resource: ResourceKey): string {
  return resource === 'settings' ? 'settings.json' : `${resource}.json`;
}

export async function handleContentRequest(
  request: Request,
  env: Env,
  authContext: AuthContext,
): Promise<unknown> {
  const method = request.method;
  const path = new URL(request.url).pathname;

  const secrets = loadGitHubSecrets(env);
  const config = parseGitHubConfig(secrets, env);
  const octokit = await createOctokit(config);
  const actor = authContext.sub;

  const draftMatch = path.match(/^\/content\/drafts\/(es|en|settings)$/);
  const publishedMatch = path.match(/^\/content\/published\/(es|en|settings)$/);

  if (method === 'GET' && draftMatch) {
    requireAuthorized(authContext, 'read_draft');
    const resource = parseResource(draftMatch[1]);
    const { data } = await readRepoJson(octokit, config, 'drafts', fileNameFor(resource));
    return { locale: resource, content: data, tier: 'drafts' };
  }

  if (method === 'GET' && publishedMatch) {
    requireAuthorized(authContext, 'read_published');
    const resource = parseResource(publishedMatch[1]);
    const { data } = await readRepoJson(octokit, config, 'published', fileNameFor(resource));
    return { locale: resource, content: data, tier: 'published' };
  }

  if (method === 'PUT' && draftMatch) {
    requireAuthorized(authContext, 'write_draft');
    const resource = parseResource(draftMatch[1]);
    const bodyText = await request.text();
    if (!bodyText) throw new Error('Missing request body');
    const payload = JSON.parse(bodyText) as { content?: unknown };
    const content = payload.content ?? payload;

    if (resource === 'settings') {
      parseSiteSettings(content);
    } else {
      parseContentDocument(content);
      if (resource === 'es') {
        const enDraft = await readRepoJson(octokit, config, 'drafts', 'en.json');
        assertLocaleParity(parseContentDocument(content), parseContentDocument(enDraft.data));
      } else {
        const esDraft = await readRepoJson(octokit, config, 'drafts', 'es.json');
        assertLocaleParity(parseContentDocument(esDraft.data), parseContentDocument(content));
      }
    }

    const existing = await readRepoJson(octokit, config, 'drafts', fileNameFor(resource));
    const commitSha = await writeRepoJson(
      octokit,
      config,
      'drafts',
      fileNameFor(resource),
      content,
      existing.sha,
      `chore(content): update draft ${resource} via admin (${actor})`,
    );

    console.log(JSON.stringify({ action: 'save_draft', resource, actor, commitSha }));
    return { locale: resource, content, tier: 'drafts', commitSha };
  }

  if (method === 'POST' && path === '/content/publish') {
    requireAuthorized(authContext, 'publish');
    const esDraft = await readRepoJson(octokit, config, 'drafts', 'es.json');
    const enDraft = await readRepoJson(octokit, config, 'drafts', 'en.json');
    assertLocaleParity(
      parseContentDocument(esDraft.data),
      parseContentDocument(enDraft.data),
    );
    parseSiteSettings((await readRepoJson(octokit, config, 'drafts', 'settings.json')).data);

    const result = await publishContent(octokit, config, actor);
    console.log(JSON.stringify({ action: 'publish', actor, commitSha: result.commitSha }));
    return { ok: true, commitSha: result.commitSha };
  }

  throw new Error('Not found');
}
