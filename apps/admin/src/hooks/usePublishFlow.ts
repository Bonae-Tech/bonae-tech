import { useCallback, useEffect, useRef, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { PublishStateValue, PublishStatusResponse } from '@bonae/content/content-store';
import { ContentApiError, abortPublish, fetchPublishStatus, publishContent } from '../infrastructure/contentApi.js';
import { PublishStatusPoller } from './publishStatusPoller.js';

/** Fixed 3s between publish status polls (INITIAL === MAX disables backoff). */
const POLL_INITIAL_MS = 3_000;
const POLL_MAX_MS = 3_000;
const PUBLISHED_BANNER_MS = 15000;
/** Stop client polling after 5 minutes regardless of state. */
const MAX_CLIENT_POLL_MS = 5 * 60 * 1000;
/** Circuit breaker: ~3 req/10s at 3s polling; trips only on scheduling bugs. */
const CIRCUIT_MAX_REQUESTS = 10;
const CIRCUIT_WINDOW_MS = 10_000;
const DISMISS_SESSION_KEY = 'bonae-admin-publish-tracking-dismissed';

function publishPollIntervalMs(completedPolls: number): number {
  if (completedPolls < 1) {
    return POLL_INITIAL_MS;
  }
  const exponent = completedPolls - 1;
  return Math.min(POLL_INITIAL_MS * 2 ** exponent, POLL_MAX_MS);
}

export type PublishDisplayPhase = PublishStateValue | 'idle';

export interface PublishFlow {
  /** Short label for the header status line, e.g. "Publishing…" or "Published." */
  statusLabel: string | null;
  isPublishing: boolean;
  isTracking: boolean;
  isFailed: boolean;
  runUrl: string | null;
  startPublish: (flushSaves: () => Promise<void>) => Promise<void>;
  /** Stop polling the API; does not cancel a server-side deploy. */
  dismissPublishTracking: () => void;
}

function statusLabelFor(
  phase: PublishDisplayPhase,
  error: string | null,
  apiError: string | null | undefined,
): string | null {
  switch (phase) {
    case 'committing':
    case 'building':
      return 'Publicando…';
    case 'success':
      return 'Publicado.';
    case 'failure':
      return error ?? apiError ?? 'Error al publicar.';
    default:
      return null;
  }
}

function publishStatusUnchanged(a: PublishStatusResponse | null, b: PublishStatusResponse): boolean {
  if (!a) {
    return false;
  }
  return (
    a.state === b.state &&
    a.commitSha === b.commitSha &&
    a.runUrl === b.runUrl &&
    a.error === b.error
  );
}

function isTrackingDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function usePublishFlow(
  onComplete: () => void,
  serverPublishState?: PublishStateValue,
): PublishFlow {
  const [phase, setPhase] = useState<PublishDisplayPhase>('idle');
  const [status, setStatus] = useState<PublishStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const resumedServerStateRef = useRef<PublishStateValue | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const pollerRef = useRef<PublishStatusPoller<PublishStatusResponse> | null>(null);
  if (!pollerRef.current) {
    pollerRef.current = new PublishStatusPoller<PublishStatusResponse>({
      fetchStatus: fetchPublishStatus,
      isInFlight: (s) => isPublishInFlight(s.state),
      intervalMs: POLL_INITIAL_MS,
      getIntervalMs: publishPollIntervalMs,
      maxDurationMs: MAX_CLIENT_POLL_MS,
      maxRequestsPerWindow: CIRCUIT_MAX_REQUESTS,
      windowMs: CIRCUIT_WINDOW_MS,
      onUpdate: (next) => {
        setStatus((prev) => (publishStatusUnchanged(prev, next) ? prev : next));
        setPhase((prev) => (prev === next.state ? prev : next.state));
      },
      onSettled: (next) => {
        setIsTracking(false);
        try {
          sessionStorage.removeItem(DISMISS_SESSION_KEY);
        } catch {
          /* ignore */
        }
        if (next.state === 'success') {
          onCompleteRef.current();
        }
      },
      onTimeout: () => {
        setIsTracking(false);
        setPhase('failure');
        setError('El seguimiento del estado de publicación expiró. El despliegue puede seguir ejecutándose en el servidor.');
      },
      onPollLimit: () => {
        setIsTracking(false);
        setPhase('failure');
        setError(
          'Se detuvo la verificación automática del estado. Abre el enlace del despliegue para ver el progreso o actualiza la página.',
        );
      },
      onCircuitBreak: ({ count, windowMs }) => {
        setIsTracking(false);
        setPhase('failure');
        setError(
          'Las verificaciones de estado eran demasiado frecuentes y se detuvieron automáticamente. Actualiza la página para ver el estado actual.',
        );
        console.error(
          JSON.stringify({ action: 'publish_status_circuit_break', count, windowMs }),
        );
      },
    });
  }
  const poller = pollerRef.current;

  const stopPolling = useCallback(() => {
    poller.stop();
    setIsTracking(false);
  }, [poller]);

  const startPolling = useCallback(() => {
    if (poller.isRunning()) {
      return;
    }
    poller.reset();
    poller.start();
    setIsTracking(true);
  }, [poller]);

  const startPollingRef = useRef(startPolling);
  startPollingRef.current = startPolling;

  const dismissPublishTracking = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    stopPolling();
    setPhase('idle');
    setStatus(null);
    setError(null);
    void abortPublish().catch(() => {
      /* best-effort — local polling already stopped */
    });
  }, [stopPolling]);

  // Resume at most once per server-side in-flight state (page reload mid-publish).
  useEffect(() => {
    if (isTrackingDismissed()) {
      return;
    }
    if (!serverPublishState || !isPublishInFlight(serverPublishState)) {
      return;
    }
    if (resumedServerStateRef.current === serverPublishState) {
      return;
    }
    resumedServerStateRef.current = serverPublishState;
    setPhase(serverPublishState);
    startPollingRef.current();
  }, [serverPublishState]);

  // Stop polling when local phase reaches a terminal state (e.g. startPublish error path).
  useEffect(() => {
    if (!isPublishInFlight(phase) && phase !== 'idle') {
      stopPolling();
    }
  }, [phase, stopPolling]);

  const startPublish = useCallback(
    async (flushSaves: () => Promise<void>) => {
      try {
        sessionStorage.removeItem(DISMISS_SESSION_KEY);
      } catch {
        /* ignore */
      }
      resumedServerStateRef.current = null;
      setError(null);
      setStatus(null);
      setPhase('committing');
      try {
        await flushSaves();
        await publishContent();
        setPhase('building');
        startPolling();
      } catch (err) {
        stopPolling();
        if (err instanceof ContentApiError && err.status === 409) {
          setError('Ya hay una publicación en curso.');
          setPhase('failure');
          return;
        }
        if (err instanceof ContentApiError && err.status === 422) {
          setError(err.errors?.join(' ') ?? err.message);
          setPhase('failure');
          return;
        }
        setError(err instanceof Error ? err.message : 'Error al publicar');
        setPhase('failure');
      }
    },
    [startPolling, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (phase !== 'success') {
      return;
    }
    const timer = setTimeout(() => setPhase('idle'), PUBLISHED_BANNER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const isPublishing = isPublishInFlight(phase);
  const statusLabel = statusLabelFor(phase, error, status?.error);

  return {
    statusLabel,
    isPublishing,
    isTracking,
    isFailed: phase === 'failure',
    runUrl: status?.runUrl ?? null,
    startPublish,
    dismissPublishTracking,
  };
}
