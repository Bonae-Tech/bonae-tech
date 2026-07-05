import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertLocaleParity,
  defaultPublishState,
  isPublishInFlight,
  parseContentDocument,
  parseSiteSettings,
  type ContentLocale,
  type ContentSection,
  type ContentStateResponse,
  type PublishState,
  type PublishStatusResponse,
} from '@bonae/content';

const publishedRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../static/content/published',
);

type Resource = ContentLocale;

function fileNameFor(resource: Resource): string {
  return resource === 'settings' ? 'settings.json' : `${resource}.json`;
}

async function readPublishedJson(resource: Resource): Promise<unknown> {
  const raw = await fs.readFile(path.join(publishedRoot, fileNameFor(resource)), 'utf8');
  return JSON.parse(raw) as unknown;
}

async function writePublishedJson(resource: Resource, data: unknown): Promise<void> {
  const filePath = path.join(publishedRoot, fileNameFor(resource));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

let publishState: PublishState = defaultPublishState();
let publishTimer: ReturnType<typeof setTimeout> | null = null;
let lastCommitSha: string | null = null;
let lastPublishedAt: number | null = null;

const memoryDrafts: Partial<Record<Resource, unknown>> = {};
const memoryPublished: Partial<Record<Resource, unknown>> = {};

async function ensureLoaded(): Promise<void> {
  if (memoryPublished.es) {
    return;
  }
  for (const resource of ['es', 'en', 'settings'] as Resource[]) {
    const published = await readPublishedJson(resource);
    memoryPublished[resource] = published;
    memoryDrafts[resource] = structuredClone(published);
  }
  const stat = await fs.stat(path.join(publishedRoot, 'es.json'));
  lastPublishedAt = stat.mtimeMs;
}

function readState(): ContentStateResponse {
  return {
    draft: {
      es: memoryDrafts.es,
      en: memoryDrafts.en,
      settings: memoryDrafts.settings,
    },
    published: {
      es: memoryPublished.es,
      en: memoryPublished.en,
      settings: memoryPublished.settings,
    },
    lastPublishedAt,
    lastCommitSha,
    publishState: { ...publishState },
  };
}

function publishStatus(): PublishStatusResponse {
  return {
    state: publishState.state,
    commitSha: publishState.commitSha,
    runUrl: publishState.runUrl,
    error: publishState.error,
  };
}

function clearPublishTimer(): void {
  if (publishTimer) {
    clearTimeout(publishTimer);
    publishTimer = null;
  }
}

async function completePublishSuccess(commitSha: string): Promise<void> {
  for (const resource of ['es', 'en', 'settings'] as Resource[]) {
    const draft = memoryDrafts[resource];
    if (draft) {
      memoryPublished[resource] = draft;
      await writePublishedJson(resource, draft);
    }
  }
  lastCommitSha = commitSha;
  lastPublishedAt = Date.now();
  publishState = {
    ...publishState,
    state: 'success',
    finishedAt: Date.now(),
    error: null,
    runUrl: publishState.runUrl ?? 'http://localhost/mock-deploy-run',
  };
}

async function completePublishFailure(message: string): Promise<void> {
  publishState = {
    ...publishState,
    state: 'failure',
    finishedAt: Date.now(),
    error: message,
    runUrl: publishState.runUrl ?? 'http://localhost/mock-deploy-run',
  };
}

function scheduleMockDeploy(commitSha: string): void {
  clearPublishTimer();
  publishTimer = setTimeout(() => {
    void completePublishSuccess(commitSha);
  }, 2000);
}

export async function mockHandleRequest(
  method: string,
  url: string,
  bodyText: string,
): Promise<{ status: number; body: unknown }> {
  await ensureLoaded();

  if (method === 'GET' && url === '/content/state') {
    return { status: 200, body: readState() };
  }

  if (method === 'GET' && url === '/content/publish/status') {
    return { status: 200, body: publishStatus() };
  }

  const draftMatch = url.match(/^\/content\/drafts\/(es|en|settings)$/);
  if (method === 'GET' && draftMatch) {
    const resource = draftMatch[1] as Resource;
    return {
      status: 200,
      body: { locale: resource, content: memoryDrafts[resource], tier: 'drafts' },
    };
  }

  const publishedMatch = url.match(/^\/content\/published\/(es|en|settings)$/);
  if (method === 'GET' && publishedMatch) {
    const resource = publishedMatch[1] as Resource;
    return {
      status: 200,
      body: { locale: resource, content: memoryPublished[resource], tier: 'published' },
    };
  }

  if (method === 'PUT' && draftMatch) {
    const resource = draftMatch[1] as Resource;
    const payload = JSON.parse(bodyText) as { content?: unknown };
    const content = payload.content ?? payload;
    memoryDrafts[resource] = content;
    return { status: 200, body: { savedAt: Date.now() } };
  }

  if (method === 'POST' && url === '/content/drafts/discard') {
    for (const resource of ['es', 'en', 'settings'] as Resource[]) {
      memoryDrafts[resource] = structuredClone(memoryPublished[resource]);
    }
    return { status: 200, body: { discarded: true } };
  }

  if (method === 'POST' && url === '/content/drafts/discard-section') {
    const { section } = JSON.parse(bodyText) as { section: ContentSection };
    for (const locale of ['es', 'en'] as const) {
      const draft = { ...(memoryDrafts[locale] as Record<string, unknown>) };
      const published = memoryPublished[locale] as Record<string, unknown>;
      draft[section] = published[section];
      memoryDrafts[locale] = draft;
    }
    return { status: 200, body: { discarded: true } };
  }

  if (method === 'POST' && url === '/content/publish') {
    if (isPublishInFlight(publishState.state)) {
      return { status: 409, body: { error: 'Publish already in flight' } };
    }

    try {
      const es = parseContentDocument(memoryDrafts.es);
      const en = parseContentDocument(memoryDrafts.en);
      assertLocaleParity(es, en);
      parseSiteSettings(memoryDrafts.settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      return { status: 422, body: { errors: [message] } };
    }

    const commitSha = `local-mock-${Date.now()}`;
    publishState = {
      state: 'committing',
      commitSha: null,
      runUrl: null,
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
    };

    await new Promise((r) => setTimeout(r, 400));

    publishState = {
      ...publishState,
      state: 'building',
      commitSha,
      runUrl: 'http://localhost/mock-deploy-run',
    };

    scheduleMockDeploy(commitSha);
    return { status: 200, body: { accepted: true } };
  }

  if (method === 'POST' && url === '/content/publish/callback') {
    const payload = JSON.parse(bodyText) as {
      commitSha: string;
      status: string;
      runUrl: string;
    };
    clearPublishTimer();
    if (publishState.state !== 'building' || publishState.commitSha !== payload.commitSha) {
      return { status: 204, body: null };
    }
    if (payload.status === 'success') {
      await completePublishSuccess(payload.commitSha);
    } else {
      await completePublishFailure(
        payload.status === 'cancelled' ? 'Deploy workflow was cancelled' : 'Deploy workflow failed',
      );
    }
    return { status: 204, body: null };
  }

  if (method === 'POST' && url === '/content/publish/abort') {
    clearPublishTimer();
    if (isPublishInFlight(publishState.state)) {
      await completePublishFailure('Publish aborted by administrator');
      return { status: 200, body: { aborted: true, state: 'failure' } };
    }
    return { status: 200, body: { aborted: false, state: publishState.state } };
  }

  return { status: 404, body: { error: 'Not found' } };
}

/** Test helper: force publish timeout failure in mock */
export function mockSimulatePublishTimeout(): void {
  clearPublishTimer();
  if (isPublishInFlight(publishState.state)) {
    void completePublishFailure('Publish timed out waiting for deploy callback');
  }
}
