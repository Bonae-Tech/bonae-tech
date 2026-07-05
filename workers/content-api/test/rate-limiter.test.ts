import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../src/rate-limiter.js';

describe('createRateLimiter', () => {
  it('allows up to the configured max requests within the window', () => {
    const limiter = createRateLimiter(3, 1000);
    const now = 0;
    expect(limiter.isAllowed('user-1', now)).toBe(true);
    expect(limiter.isAllowed('user-1', now)).toBe(true);
    expect(limiter.isAllowed('user-1', now)).toBe(true);
    // 4th request within the same instant exceeds the cap.
    expect(limiter.isAllowed('user-1', now)).toBe(false);
  });

  it('rejects a runaway loop that fires far faster than the healthy cadence', () => {
    const limiter = createRateLimiter(20, 10_000);
    let allowedCount = 0;
    let rejectedCount = 0;
    // Simulate 200 requests fired within 1 second (a runaway polling bug).
    for (let i = 0; i < 200; i += 1) {
      const now = i * 5;
      if (limiter.isAllowed('user-1', now)) {
        allowedCount += 1;
      } else {
        rejectedCount += 1;
      }
    }
    expect(allowedCount).toBeLessThanOrEqual(20);
    expect(rejectedCount).toBeGreaterThan(0);
  });

  it('recovers once the window has elapsed', () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.isAllowed('user-1', 0)).toBe(true);
    expect(limiter.isAllowed('user-1', 500)).toBe(false);
    expect(limiter.isAllowed('user-1', 1500)).toBe(true);
  });

  it('tracks separate callers independently', () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.isAllowed('user-1', 0)).toBe(true);
    expect(limiter.isAllowed('user-2', 0)).toBe(true);
    expect(limiter.isAllowed('user-1', 0)).toBe(false);
    expect(limiter.isAllowed('user-2', 0)).toBe(false);
  });
});
