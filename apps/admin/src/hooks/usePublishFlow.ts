import { useCallback, useEffect, useRef, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { PublishStateValue, PublishStatusResponse } from '@bonae/content/content-store';
import { ContentApiError, fetchPublishStatus, publishContent } from '../infrastructure/contentApi.js';

const POLL_MS = 1500;
const PUBLISHED_BANNER_MS = 5000;

export type PublishDisplayPhase = PublishStateValue | 'idle';

export interface PublishFlow {
  /** Short label for the header status line, e.g. "Publishing…" or "Published." */
  statusLabel: string | null;
  isPublishing: boolean;
  isFailed: boolean;
  runUrl: string | null;
  startPublish: (flushSaves: () => Promise<void>) => Promise<void>;
  resumeIfInFlight: (initialState: PublishStateValue) => void;
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

export function usePublishFlow(onComplete: () => void): PublishFlow {
  const [phase, setPhase] = useState<PublishDisplayPhase>('idle');
  const [status, setStatus] = useState<PublishStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingActiveRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    try {
      const next = await fetchPublishStatus();
      setStatus(next);
      setPhase(next.state);
      if (!isPublishInFlight(next.state)) {
        stopPolling();
        if (next.state === 'success') {
          onCompleteRef.current();
        }
      }
    } catch {
      // Keep polling — a transient network error should not stop tracking an in-flight publish.
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (pollingActiveRef.current) {
      return;
    }
    pollingActiveRef.current = true;
    void pollOnce();
    pollRef.current = setInterval(() => {
      void pollOnce();
    }, POLL_MS);
  }, [pollOnce]);

  const resumeIfInFlight = useCallback(
    (initialState: PublishStateValue) => {
      if (!isPublishInFlight(initialState)) {
        return;
      }
      setPhase(initialState);
      startPolling();
    },
    [startPolling],
  );

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
    resumeIfInFlight,
  };
}
