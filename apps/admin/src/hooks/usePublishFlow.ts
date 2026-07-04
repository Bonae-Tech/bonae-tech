import { useCallback, useEffect, useRef, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { PublishStateValue, PublishStatusResponse } from '@bonae/content/content-store';
import { ContentApiError, fetchPublishStatus, publishContent } from '../infrastructure/contentApi.js';

/** Interval between status polls while a publish is in flight. */
const POLL_MS = 3000;
const PUBLISHED_BANNER_MS = 5000;

export type PublishDisplayPhase = PublishStateValue | 'idle';

export interface PublishFlow {
  /** Short label for the header status line, e.g. "Publishing…" or "Published." */
  statusLabel: string | null;
  isPublishing: boolean;
  isFailed: boolean;
  runUrl: string | null;
  startPublish: (flushSaves: () => Promise<void>) => Promise<void>;
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

export function usePublishFlow(
  onComplete: () => void,
  serverPublishState?: PublishStateValue,
): PublishFlow {
  const [phase, setPhase] = useState<PublishDisplayPhase>('idle');
  const [status, setStatus] = useState<PublishStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingActiveRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const resumedServerStateRef = useRef<PublishStateValue | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (requestInFlightRef.current) {
      return;
    }
    requestInFlightRef.current = true;
    try {
      const next = await fetchPublishStatus();
      setStatus((prev) => (publishStatusUnchanged(prev, next) ? prev : next));
      setPhase((prev) => (prev === next.state ? prev : next.state));
      if (!isPublishInFlight(next.state)) {
        stopPolling();
        if (next.state === 'success') {
          onCompleteRef.current();
        }
      }
    } catch {
      // Keep polling — a transient network error should not stop tracking an in-flight publish.
    } finally {
      requestInFlightRef.current = false;
    }
  }, [stopPolling]);

  const scheduleNextPoll = useCallback(() => {
    if (!pollingActiveRef.current) {
      return;
    }
    pollTimerRef.current = setTimeout(() => {
      void pollOnce().finally(() => {
        scheduleNextPoll();
      });
    }, POLL_MS);
  }, [pollOnce]);

  const startPolling = useCallback(() => {
    if (pollingActiveRef.current) {
      return;
    }
    pollingActiveRef.current = true;
    void pollOnce().finally(() => {
      if (pollingActiveRef.current) {
        scheduleNextPoll();
      }
    });
  }, [pollOnce, scheduleNextPoll]);

  const startPollingRef = useRef(startPolling);
  startPollingRef.current = startPolling;

  // Resume at most once per server-side in-flight state (page reload mid-publish).
  useEffect(() => {
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

  const startPublish = useCallback(
    async (flushSaves: () => Promise<void>) => {
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
    isFailed: phase === 'failure',
    runUrl: status?.runUrl ?? null,
    startPublish,
  };
}
