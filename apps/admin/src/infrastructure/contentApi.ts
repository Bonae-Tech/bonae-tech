import type { ContentDocument, Locale, SiteSettings } from '@bonae/content';
import { config } from '../config.js';
import { getIdToken } from './auth.js';

export type ContentResource = Locale | 'settings';

export interface ContentResponse<T> {
  locale: ContentResource;
  content: T;
  tier: 'drafts' | 'published';
  commitSha?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
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
