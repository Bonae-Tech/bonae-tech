/**
 * Best-effort in-memory sliding-window rate limiter, scoped per Worker isolate.
 *
 * This is a defense-in-depth guard: it does not require persistent storage and
 * resets on isolate restart, so it must not be relied on for strict security.
 * Its job is to make sure that no single caller (identified by `key`, e.g. a
 * Cognito user id) can turn a client-side bug or runaway loop into unbounded
 * load on the Durable Object.
 */
export interface RateLimiter {
  /** Records a hit for `key` and returns false if it exceeds the configured rate. */
  isAllowed(key: string, now?: number): boolean;
}

export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    isAllowed(key: string, now = Date.now()): boolean {
      const timestamps = hits.get(key) ?? [];
      const recent = timestamps.filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);

      // Bound memory even if many distinct keys hammer the limiter.
      if (hits.size > 500) {
        const oldestKey = hits.keys().next().value;
        if (oldestKey !== undefined && oldestKey !== key) {
          hits.delete(oldestKey);
        }
      }

      return recent.length <= maxRequests;
    },
  };
}
