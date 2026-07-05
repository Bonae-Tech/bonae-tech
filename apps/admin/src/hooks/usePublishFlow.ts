import { useCallback, useEffect, useRef, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { PublishStateValue, PublishStatusResponse } from '@bonae/content/content-store';
import { ContentApiError, abortPublish, fetchPublishStatus, publishContent } from '../infrastructure/contentApi.js';
import { PublishStatusPoller } from './publishStatusPoller.js';

/** Interval between status polls while a publish is in flight. */
const POLL_MS = 3000;
const PUBLISHED_BANNER_MS = 5000;
/** Stop client polling slightly after the worker alarm (15 min). */
const MAX_CLIENT_POLL_MS = 16 * 60 * 1000;
/**
 * Circuit breaker: at POLL_MS=3000 a healthy loop makes ~1 request every 3s.
 * Cap well above that (10 requests / 10s) so any future scheduling regression
 * trips the breaker in seconds instead of hammering the API indefinitely.
 */
const CIRCUIT_MAX_REQUESTS = 10;
const CIRCUIT_WINDOW_MS = 10_000;
const DISMISS_SESSION_KEY = 'bonae-admin-publish-tracking-dismissed';

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
      return 'Publishing…';
    case 'success':
      return 'Published.';
    case 'failure':
      return error ?? apiError ?? 'Publish failed.';
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
      intervalMs: POLL_MS,
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
        setError('Publish status tracking timed out. The deploy may still be running on the server.');
      },
      onCircuitBreak: ({ count, windowMs }) => {
        setIsTracking(false);
        setPhase('failure');
        setError('Publish status checks were happening too fast and were stopped automatically. Refresh the page to check the current status.');
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
          setError('A publish is already in progress.');
          setPhase('failure');
          return;
        }
        if (err instanceof ContentApiError && err.status === 422) {
          setError(err.errors?.join(' ') ?? err.message);
          setPhase('failure');
          return;
        }
        setError(err instanceof Error ? err.message : 'Publish failed');
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
