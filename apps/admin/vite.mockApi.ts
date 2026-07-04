import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  assertLocaleParity,
  parseContentDocument,
  parseSiteSettings,
} from '@bonae/content';

const contentRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../static/content',
);

type Tier = 'drafts' | 'published';
type Resource = 'es' | 'en' | 'settings';

function tierDir(tier: Tier): string {
  return path.join(contentRoot, tier);
}

function fileNameFor(resource: Resource): string {
  return resource === 'settings' ? 'settings.json' : `${resource}.json`;
}

async function readJson(tier: Tier, resource: Resource): Promise<unknown> {
  const raw = await fs.readFile(path.join(tierDir(tier), fileNameFor(resource)), 'utf8');
  return JSON.parse(raw) as unknown;
}

async function writeJson(tier: Tier, resource: Resource, data: unknown): Promise<void> {
  const filePath = path.join(tierDir(tier), fileNameFor(resource));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function validateDraftSave(resource: Resource, content: unknown): Promise<void> {
  if (resource === 'settings') {
    parseSiteSettings(content);
    return;
  }

  parseContentDocument(content);
  const otherLocale = resource === 'es' ? 'en' : 'es';
  const otherDraft = await readJson('drafts', otherLocale);
  if (resource === 'es') {
    assertLocaleParity(parseContentDocument(content), parseContentDocument(otherDraft));
  } else {
    assertLocaleParity(parseContentDocument(otherDraft), parseContentDocument(content));
  }
}

export function contentApiMockPlugin(): Plugin {
  return {
    name: 'bonae-content-api-mock',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address();
        const port = typeof addr === 'object' && addr ? addr.port : 5173;
        console.log(`[bonae-content-api-mock] /content/* → ${contentRoot} (http://localhost:${port})`);
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/content/')) {
          next();
          return;
        }

        const method = req.method ?? 'GET';
        const draftMatch = url.match(/^\/content\/drafts\/(es|en|settings)$/);
        const publishedMatch = url.match(/^\/content\/published\/(es|en|settings)$/);

        try {
          if (method === 'GET' && draftMatch) {
            const resource = draftMatch[1] as Resource;
            const content = await readJson('drafts', resource);
            sendJson(res, 200, { locale: resource, content, tier: 'drafts' });
            return;
          }

          if (method === 'GET' && publishedMatch) {
            const resource = publishedMatch[1] as Resource;
            const content = await readJson('published', resource);
            sendJson(res, 200, { locale: resource, content, tier: 'published' });
            return;
          }

          if (method === 'PUT' && draftMatch) {
            const resource = draftMatch[1] as Resource;
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as { content?: unknown };
            const content = payload.content ?? payload;
            await validateDraftSave(resource, content);
            await writeJson('drafts', resource, content);
            const commitSha = `local-mock-${Date.now()}`;
            sendJson(res, 200, { locale: resource, content, tier: 'drafts', commitSha });
            return;
          }

          if (method === 'POST' && url === '/content/publish') {
            const esDraft = parseContentDocument(await readJson('drafts', 'es'));
            const enDraft = parseContentDocument(await readJson('drafts', 'en'));
            assertLocaleParity(esDraft, enDraft);
            parseSiteSettings(await readJson('drafts', 'settings'));

            for (const resource of ['es', 'en', 'settings'] as Resource[]) {
              await writeJson('published', resource, await readJson('drafts', resource));
            }

            const commitSha = `local-mock-publish-${Date.now()}`;
            sendJson(res, 200, { ok: true, commitSha });
            return;
          }

          sendJson(res, 404, { error: 'Not found' });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Request failed';
          sendJson(res, 400, { error: message });
        }
      });
    },
  };
}
