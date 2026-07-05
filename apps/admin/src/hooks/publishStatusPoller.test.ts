import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishStatusPoller } from './publishStatusPoller.js';

interface FakeStatus {
  state: 'building' | 'success' | 'failure';
}

function inFlight(s: FakeStatus): boolean {
  return s.state === 'building';
}

describe('PublishStatusPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls at the configured interval and stops once no longer in flight', async () => {
    let calls = 0;
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => {
      calls += 1;
      return calls < 3 ? { state: 'building' } : { state: 'success' };
    });
    const onSettled = vi.fn();

    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 1000,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 10,
      windowMs: 10_000,
      onSettled,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0); // first (immediate) poll
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(poller.isRunning()).toBe(false);

    // No further requests fire after settling.
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
  });

  it('start() is idempotent — calling it twice never creates a second loop', async () => {
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => ({ state: 'building' }));
    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 1000,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 10,
      windowMs: 10_000,
    });

    // Simulates a React StrictMode double-effect invocation.
    poller.start();
    poller.start();
    poller.start();

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    // Exactly one request per interval tick, not one per start() call.
    expect(fetchStatus).toHaveBeenCalledTimes(4);
  });

  it('trips the circuit breaker if requests happen faster than the configured cap', async () => {
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => ({ state: 'building' }));
    const onCircuitBreak = vi.fn();

    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      // Misconfigured to poll far faster than the breaker allows, simulating
      // a future scheduling regression rather than the intended cadence.
      intervalMs: 1,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 5,
      windowMs: 1_000,
      onCircuitBreak,
    });

    poller.start();
    for (let i = 0; i < 20; i += 1) {
      await vi.advanceTimersByTimeAsync(1);
    }

    expect(poller.isTripped()).toBe(true);
    expect(poller.isRunning()).toBe(false);
    expect(onCircuitBreak).toHaveBeenCalledTimes(1);
    expect(fetchStatus.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it('ignores a stale in-flight response after stop() + start() (generation guard)', async () => {
    let resolveFirst!: (status: FakeStatus) => void;
    const firstResponse = new Promise<FakeStatus>((resolve) => {
      resolveFirst = resolve;
    });
    let callCount = 0;
    const fetchStatus = vi.fn((): Promise<FakeStatus> => {
      callCount += 1;
      return callCount === 1 ? firstResponse : Promise.resolve({ state: 'building' });
    });

    const onUpdate = vi.fn();
    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 1000,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 10,
      windowMs: 10_000,
      onUpdate,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    poller.stop();
    poller.start(); // new generation while the first request is still pending

    resolveFirst({ state: 'success' });
    await vi.advanceTimersByTimeAsync(0);

    // The stale response must not be applied, and must not schedule extra polls.
    expect(onUpdate).not.toHaveBeenCalledWith({ state: 'success' });
  });

  it('stops after maxDurationMs even if the status never leaves the in-flight set', async () => {
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => ({ state: 'building' }));
    const onTimeout = vi.fn();

    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 1000,
      maxDurationMs: 5000,
      maxRequestsPerWindow: 100,
      windowMs: 10_000,
      onTimeout,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(6000);

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(poller.isRunning()).toBe(false);
  });

  it('uses getIntervalMs backoff between polls', async () => {
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => ({ state: 'building' }));

    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 1000,
      getIntervalMs: (completedPolls) => completedPolls * 1000,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 100,
      windowMs: 10_000,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchStatus).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchStatus).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
  });

  it('stops after maxPollCount while still in flight', async () => {
    const fetchStatus = vi.fn(async (): Promise<FakeStatus> => ({ state: 'building' }));
    const onPollLimit = vi.fn();

    const poller = new PublishStatusPoller<FakeStatus>({
      fetchStatus,
      isInFlight: inFlight,
      intervalMs: 100,
      maxPollCount: 3,
      maxDurationMs: 60_000,
      maxRequestsPerWindow: 100,
      windowMs: 10_000,
      onPollLimit,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(onPollLimit).toHaveBeenCalledTimes(1);
    expect(poller.isRunning()).toBe(false);

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
  });
});
