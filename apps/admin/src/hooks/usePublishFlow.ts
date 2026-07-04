import { useCallback, useEffect, useRef, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { PublishStateValue, PublishStatusResponse } from '@bonae/content/content-store';
import { ContentApiError, fetchPublishStatus, publishContent } from '../infrastructure/contentApi.js';

const POLL_MS = 1500;

export type PublishOverlayStage = PublishStateValue | 'dismissed';

export interface PublishFlow {
  overlayOpen: boolean;
  stage: PublishOverlayStage;
  status: PublishStatusResponse | null;
  error: string | null;
  startPublish: (flushSaves: () => Promise<void>) => Promise<void>;
  dismissOverlay: () => void;
  resumeIfInFlight: (initialState: PublishStateValue) => void;
}

export function usePublishFlow(onComplete: () => void): PublishFlow {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [stage, setStage] = useState<PublishOverlayStage>('dismissed');
  const [status, setStatus] = useState<PublishStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    const next = await fetchPublishStatus();
    setStatus(next);
    setStage(next.state);
    if (!isPublishInFlight(next.state)) {
      stopPolling();
      if (next.state === 'success') {
        onComplete();
      }
    }
  }, [onComplete, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    void pollOnce();
    pollRef.current = setInterval(() => {
      void pollOnce();
    }, POLL_MS);
  }, [pollOnce, stopPolling]);

  const resumeIfInFlight = useCallback(
    (initialState: PublishStateValue) => {
      if (!isPublishInFlight(initialState) && initialState !== 'success' && initialState !== 'failure') {
        return;
      }
      setOverlayOpen(true);
      setStage(initialState);
      if (isPublishInFlight(initialState)) {
        startPolling();
      }
    },
    [startPolling],
  );

  const startPublish = useCallback(
    async (flushSaves: () => Promise<void>) => {
      setError(null);
      setOverlayOpen(true);
      setStage('committing');
      try {
        await flushSaves();
        await publishContent();
        setStage('building');
        startPolling();
      } catch (err) {
        stopPolling();
        if (err instanceof ContentApiError && err.status === 409) {
          setError('A publish is already in progress.');
          setStage('failure');
          return;
        }
        if (err instanceof ContentApiError && err.status === 422) {
          setError(err.errors?.join(' ') ?? err.message);
          setStage('failure');
          return;
        }
        setError(err instanceof Error ? err.message : 'Publish failed');
        setStage('failure');
      }
    },
    [startPolling, stopPolling],
  );

  const dismissOverlay = useCallback(() => {
    stopPolling();
    setOverlayOpen(false);
    setStage('dismissed');
    setStatus(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    overlayOpen,
    stage,
    status,
    error,
    startPublish,
    dismissOverlay,
    resumeIfInFlight,
  };
}
