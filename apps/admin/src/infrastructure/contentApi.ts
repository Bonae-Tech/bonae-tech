import type {
  ContentDocument,
  ContentSection,
  ContentStateResponse,
  Locale,
  PublishStatusResponse,
  SiteSettings,
} from '@bonae/content';
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

export class ContentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: string[],
  ) {
    super(message);
    this.name = 'ContentApiError';
  }
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
      ? 'No se pudo conectar con la API mock local. Detén otros servidores de desarrollo, ejecuta `npm run admin:dev:mock` desde la raíz del repositorio, abre la URL que aparece en la terminal (a menudo http://localhost:5173) y busca el banner amarillo de “Modo mock local”.'
      : 'Error de red al contactar la API de contenido. Verifica VITE_API_BASE_URL en apps/admin/.env.';
    throw new Error(hint);
  }

  const text = await res.text();
  type ErrorBody = { error?: string; errors?: string[] };
  const body = (text ? JSON.parse(text) : null) as (T & ErrorBody) | null;

  if (!res.ok) {
    if (res.status === 401 && !retried) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch(path, init, true);
      }
      sessionExpiredCallback?.('expired');
      throw new SessionExpiredError(body?.error ?? 'Sesión expirada');
    }
    if (res.status === 401) {
      sessionExpiredCallback?.('expired');
      throw new SessionExpiredError(body?.error ?? 'Sesión expirada');
    }
    const errorMessage = body?.error ?? `La solicitud falló (${res.status})`;
    throw new ContentApiError(errorMessage, res.status, body?.errors);
  }

  return body as T;
}

export function fetchContentState(): Promise<ContentStateResponse> {
  return apiFetch('/content/state');
}

export function fetchDraft(resource: ContentResource): Promise<{
  locale: ContentResource;
  content: ContentDocument | SiteSettings;
  tier: 'drafts';
}> {
  return apiFetch(`/content/drafts/${resource}`);
}

export function saveDraft(
  resource: ContentResource,
  content: ContentDocument | SiteSettings,
): Promise<{ savedAt: number }> {
  return apiFetch(`/content/drafts/${resource}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }).then((body) => {
    const savedAt =
      body && typeof body === 'object' && 'savedAt' in body && typeof body.savedAt === 'number'
        ? body.savedAt
        : Date.now();
    return { savedAt };
  });
}

export function discardAllDrafts(): Promise<{ discarded: true }> {
  return apiFetch('/content/drafts/discard', { method: 'POST', body: '{}' });
}

export function discardSection(section: ContentSection): Promise<{ discarded: true }> {
  return apiFetch('/content/drafts/discard-section', {
    method: 'POST',
    body: JSON.stringify({ section }),
  });
}

export function publishContent(): Promise<{ accepted: true }> {
  return apiFetch('/content/publish', { method: 'POST', body: '{}' });
}

export function fetchPublishStatus(): Promise<PublishStatusResponse> {
  return apiFetch('/content/publish/status');
}

export function abortPublish(): Promise<{ aborted: boolean; state: string }> {
  return apiFetch('/content/publish/abort', { method: 'POST', body: '{}' });
}

/** @deprecated Use fetchContentState — kept for gradual migration */
export type ContentResponse<T> = {
  locale: ContentResource;
  content: T;
  tier: 'drafts' | 'published';
  commitSha?: string;
};
