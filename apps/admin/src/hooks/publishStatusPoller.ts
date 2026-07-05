/**
 * Framework-agnostic polling loop for publish status.
 *
 * This is deliberately isolated from React so it can be unit-tested without a
 * DOM/browser, and so all the "don't runaway" guards live in one place:
 *
 * 1. Single in-flight request at a time (never overlaps requests).
 * 2. Single active timer chain (start() is idempotent — calling it twice,
 *    e.g. from a React StrictMode double-effect, never creates a second loop).
 * 3. A "generation" counter invalidates stale in-flight responses after
 *    stop()/start() so a slow response from a previous session can't resurrect
 *    a loop or double-schedule a timer.
 * 4. A hard circuit breaker: if requests happen faster than the configured
 *    rate allows (e.g. because of a future regression in the scheduling
 *    logic above), polling stops itself and reports an error instead of
 *    continuing to hammer the API.
 * 5. A max total tracking duration, independent of the breaker, so a stuck
 *   server-side state can't be polled forever.
 * 6. Optional per-poll backoff and a hard poll-count cap so long builds don't
 *   imply one status request per fixed interval for the entire tracking window.
 */
export interface PublishStatusPollerOptions<T> {
  fetchStatus: () => Promise<T>;
  isInFlight: (status: T) => boolean;
  /** Default delay between polls when `getIntervalMs` is not set. */
  intervalMs: number;
  /** Delay before the next poll; `completedPolls` is how many fetches have finished. */
  getIntervalMs?: (completedPolls: number) => number;
  /** Stop after this many status fetches while still in flight. */
  maxPollCount?: number;
  /** Stop tracking after this much wall-clock time regardless of state. */
  maxDurationMs: number;
  /** Circuit breaker: max requests allowed within `windowMs`. */
  maxRequestsPerWindow: number;
  windowMs: number;
  onUpdate?: (status: T) => void;
  /** Called once when polling stops because the status left the in-flight set. */
  onSettled?: (status: T) => void;
  onTimeout?: () => void;
  onPollLimit?: (info: { pollCount: number }) => void;
  onCircuitBreak?: (info: { count: number; windowMs: number }) => void;
}

export class PublishStatusPoller<T> {
  private running = false;
  private requestInFlight = false;
  private tripped = false;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startedAt: number | null = null;
  private requestTimestamps: number[] = [];
  private pollCount = 0;

  constructor(private readonly opts: PublishStatusPollerOptions<T>) {}

  isRunning(): boolean {
    return this.running;
  }

  isTripped(): boolean {
    return this.tripped;
  }

  /** Idempotent: a second call while already running is a no-op (no second loop). */
  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.startedAt = Date.now();
    this.generation += 1;
    this.scheduleNow(this.generation);
  }

  stop(): void {
    this.running = false;
    this.startedAt = null;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Allow polling to be started again after a circuit-break (e.g. a fresh publish). */
  reset(): void {
    this.stop();
    this.tripped = false;
    this.requestTimestamps = [];
    this.pollCount = 0;
  }

  private nextIntervalMs(): number {
    return this.opts.getIntervalMs?.(this.pollCount) ?? this.opts.intervalMs;
  }

  private scheduleNow(generation: number): void {
    void this.pollOnce(generation).finally(() => {
      if (this.running && generation === this.generation) {
        this.scheduleNext(generation);
      }
    });
  }

  private scheduleNext(generation: number): void {
    if (!this.running || generation !== this.generation) {
      return;
    }
    this.timer = setTimeout(() => {
      void this.pollOnce(generation).finally(() => {
        if (this.running && generation === this.generation) {
          this.scheduleNext(generation);
        }
      });
    }, this.nextIntervalMs());
  }

  /** Returns false (and trips the breaker) if the request rate exceeds the configured cap. */
  private recordRequestAndCheckCircuit(now: number): boolean {
    const { windowMs, maxRequestsPerWindow } = this.opts;
    this.requestTimestamps.push(now);
    while (this.requestTimestamps.length > 0 && now - this.requestTimestamps[0] > windowMs) {
      this.requestTimestamps.shift();
    }
    if (this.requestTimestamps.length > maxRequestsPerWindow) {
      this.tripped = true;
      this.stop();
      this.opts.onCircuitBreak?.({ count: this.requestTimestamps.length, windowMs });
      return false;
    }
    return true;
  }

  private async pollOnce(generation: number): Promise<void> {
    if (!this.running || generation !== this.generation) {
      return;
    }
    if (this.requestInFlight) {
      return;
    }
    if (this.startedAt !== null && Date.now() - this.startedAt > this.opts.maxDurationMs) {
      this.stop();
      this.opts.onTimeout?.();
      return;
    }
    if (!this.recordRequestAndCheckCircuit(Date.now())) {
      return;
    }
    if (this.opts.maxPollCount !== undefined && this.pollCount >= this.opts.maxPollCount) {
      this.stop();
      this.opts.onPollLimit?.({ pollCount: this.pollCount });
      return;
    }

    this.requestInFlight = true;
    try {
      const status = await this.opts.fetchStatus();
      if (generation !== this.generation) {
        return;
      }
      this.pollCount += 1;
      // #region agent log
      fetch('http://127.0.0.1:7768/ingest/36033ee5-db8c-4429-bd42-cc7f53ef3b11',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c8cfcf'},body:JSON.stringify({sessionId:'c8cfcf',location:'publishStatusPoller.ts:pollOnce',message:'publish status poll',data:{pollCount:this.pollCount,nextIntervalMs:this.nextIntervalMs(),stillInFlight:this.opts.isInFlight(status)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.opts.onUpdate?.(status);
      if (!this.opts.isInFlight(status)) {
        this.stop();
        this.opts.onSettled?.(status);
      }
    } catch {
      // Transient network error — keep polling on schedule.
    } finally {
      this.requestInFlight = false;
    }
  }
}
