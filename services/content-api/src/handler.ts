import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  parseContentDocument,
  parseSiteSettings,
  assertLocaleParity,
  type Locale,
} from '@bonae/content';
import {
  createOctokit,
  parseGitHubConfig,
  publishContent,
  readRepoJson,
  writeRepoJson,
} from './github.js';
import { loadGitHubSecrets } from './secrets.js';

const corsOrigin = process.env.CORS_ORIGIN ?? '*';

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function parseCognitoGroups(groupsRaw: unknown): string[] {
  if (groupsRaw == null) return [];
  if (Array.isArray(groupsRaw)) return groupsRaw.map(String);
  if (typeof groupsRaw !== 'string') return [];

  const trimmed = groupsRaw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through to comma split
    }
  }

  return trimmed.split(',').map((group) => group.trim()).filter(Boolean);
}

function requireAdmin(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const claims = event.requestContext.authorizer.jwt.claims;
  const groupsRaw = claims['cognito:groups'];
  const groups = parseCognitoGroups(groupsRaw);

  if (!groups.includes('Administrators')) {
    throw new Error('Forbidden: Administrators group required');
  }

  const sub = claims.sub;
  if (typeof sub !== 'string' || !sub) {
    throw new Error('Unauthorized');
  }
  return sub;
}

type ResourceKey = Locale | 'settings';

function parseResource(raw: string | undefined): ResourceKey {
  if (raw === 'es' || raw === 'en' || raw === 'settings') return raw;
  throw new Error('Invalid locale. Use es, en, or settings');
}

function fileNameFor(resource: ResourceKey): string {
  return resource === 'settings' ? 'settings.json' : `${resource}.json`;
}

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext.http.method === 'OPTIONS') {
    return json(204, {});
  }

  try {
    const actor = requireAdmin(event);
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const secrets = await loadGitHubSecrets();
    const config = parseGitHubConfig(secrets);
    const octokit = await createOctokit(config);

    const draftMatch = path.match(/^\/content\/drafts\/(es|en|settings)$/);
    const publishedMatch = path.match(/^\/content\/published\/(es|en|settings)$/);

    if (method === 'GET' && draftMatch) {
      const resource = parseResource(draftMatch[1]);
      const { data } = await readRepoJson(octokit, config, 'drafts', fileNameFor(resource));
      return json(200, { locale: resource, content: data, tier: 'drafts' });
    }

    if (method === 'GET' && publishedMatch) {
      const resource = parseResource(publishedMatch[1]);
      const { data } = await readRepoJson(octokit, config, 'published', fileNameFor(resource));
      return json(200, { locale: resource, content: data, tier: 'published' });
    }

    if (method === 'PUT' && draftMatch) {
      const resource = parseResource(draftMatch[1]);
      if (!event.body) throw new Error('Missing request body');
      const payload = JSON.parse(event.body) as { content?: unknown };
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
      return json(200, { locale: resource, content, tier: 'drafts', commitSha });
    }

    if (method === 'POST' && path === '/content/publish') {
      const esDraft = await readRepoJson(octokit, config, 'drafts', 'es.json');
      const enDraft = await readRepoJson(octokit, config, 'drafts', 'en.json');
      assertLocaleParity(
        parseContentDocument(esDraft.data),
        parseContentDocument(enDraft.data),
      );
      parseSiteSettings((await readRepoJson(octokit, config, 'drafts', 'settings.json')).data);

      const result = await publishContent(octokit, config, actor);
      console.log(JSON.stringify({ action: 'publish', actor, commitSha: result.commitSha }));
      return json(200, { ok: true, commitSha: result.commitSha });
    }

    return json(404, { error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = message.startsWith('Forbidden') ? 403 : message.startsWith('Unauthorized') ? 401 : 400;
    console.error(JSON.stringify({ error: message }));
    return json(status, { error: message });
  }
}
