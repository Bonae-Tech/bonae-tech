import type { ContentDocument, Locale, SiteSettings } from '@bonae/content';
import { config } from '../config.js';
import {
  getIdToken,
  onSessionExpired,
  onSessionRefreshed,
  refreshSession,
  SessionExpiredError,
  type LogoutReason,
} from './auth.js';

export type ContentResource = Locale | 'settings';

export interface ContentResponse<T> {
  locale: ContentResource;
  content: T;
  tier: 'drafts' | 'published';
  commitSha?: string;
}

let sessionExpiredCallback: ((reason: LogoutReason) => void) | null = null;
let sessionRefreshedCallback: (() => void) | null = null;

void onSessionExpired((reason) => {
  sessionExpiredCallback?.(reason);
});

void onSessionRefreshed(() => {
  sessionRefreshedCallback?.();
});

export function registerSessionExpiredHandler(handler: (reason: LogoutReason) => void): void {
  sessionExpiredCallback = handler;
}

export function registerSessionRefreshedHandler(handler: () => void): void {
  sessionRefreshedCallback = handler;
}

async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  let token: string;
  try {
    token = await getIdToken();
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      sessionExpiredCallback?.('expired');
    }
    throw err;
  }

  const url = `${config.apiBaseUrl}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    const hint = config.useMock
      ? 'Could not reach the local mock API. Stop other dev servers, run `npm run admin:dev:mock` from the repo root, open the URL shown in the terminal (often http://localhost:5173), and look for the yellow “Local mock mode” banner.'
      : 'Network error contacting the content API. Check VITE_API_BASE_URL in apps/admin/.env.';
    throw new Error(hint);
  }

  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 401 && !retried) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch(path, init, true);
      }
      sessionExpiredCallback?.('expired');
      throw new SessionExpiredError(body.error ?? 'Session expired');
    }
    if (res.status === 401) {
      sessionExpiredCallback?.('expired');
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
