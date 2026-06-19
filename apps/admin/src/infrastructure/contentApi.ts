import type { ContentDocument, Locale, SiteSettings } from '@bonae/content';
import { config } from '../config.js';
import { getIdToken, onSessionExpired, SessionExpiredError } from './auth.js';

export type ContentResource = Locale | 'settings';

export interface ContentResponse<T> {
  locale: ContentResource;
  content: T;
  tier: 'drafts' | 'published';
  commitSha?: string;
}

let sessionExpiredCallback: (() => void) | null = null;

void onSessionExpired(() => {
  sessionExpiredCallback?.();
});

export function registerSessionExpiredHandler(handler: () => void): void {
  sessionExpiredCallback = handler;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token: string;
  try {
    token = await getIdToken();
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      sessionExpiredCallback?.();
    }
    throw err;
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 401) {
      sessionExpiredCallback?.();
      throw new SessionExpiredError(body.error ?? 'Session expired');
    }
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body;
}

export function fetchDraft(resource: ContentResource): Promise<ContentResponse<ContentDocument | SiteSettings>> {
  return apiFetch(`/content/drafts/${resource}`);
}

export function saveDraft(
  resource: ContentResource,
  content: ContentDocument | SiteSettings,
): Promise<ContentResponse<ContentDocument | SiteSettings>> {
  return apiFetch(`/content/drafts/${resource}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function publishContent(): Promise<{ ok: boolean; commitSha: string }> {
  return apiFetch('/content/publish', { method: 'POST', body: '{}' });
}
