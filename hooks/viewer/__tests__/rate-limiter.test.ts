import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RateLimiter, DEFAULT_RATE_LIMIT } from "../rate-limiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    rateLimiter?.stop();
    vi.useRealTimers();
  });

  it("should allow first connection", () => {
    rateLimiter = new RateLimiter(DEFAULT_RATE_LIMIT);
    expect(rateLimiter.isAllowed("127.0.0.1")).toBe(true);
  });

  it("should allow up to maxConnections", () => {
    rateLimiter = new RateLimiter({ maxConnections: 3, windowMs: 60_000 });
    const ip = "127.0.0.1";

    expect(rateLimiter.isAllowed(ip)).toBe(true);
    expect(rateLimiter.isAllowed(ip)).toBe(true);
    expect(rateLimiter.isAllowed(ip)).toBe(true);
  });

  it("should deny when limit exceeded", () => {
    rateLimiter = new RateLimiter({ maxConnections: 3, windowMs: 60_000 });
    const ip = "127.0.0.1";

    rateLimiter.isAllowed(ip);
    rateLimiter.isAllowed(ip);
    rateLimiter.isAllowed(ip);

    expect(rateLimiter.isAllowed(ip)).toBe(false);
  });

  it("should reset count in new window", () => {
    rateLimiter = new RateLimiter({ maxConnections: 2, windowMs: 60_000 });
    const ip = "127.0.0.1";

    rateLimiter.isAllowed(ip);
    rateLimiter.isAllowed(ip);
    expect(rateLimiter.isAllowed(ip)).toBe(false);

    // Advance time beyond window
    vi.advanceTimersByTime(60_001);

    expect(rateLimiter.isAllowed(ip)).toBe(true);
  });

  it("should cleanup expired entries", () => {
    rateLimiter = new RateLimiter({ maxConnections: 5, windowMs: 60_000 });
    const ip1 = "127.0.0.1";
    const ip2 = "192.168.1.1";

    rateLimiter.isAllowed(ip1);
    rateLimiter.isAllowed(ip2);

    // Advance time beyond window
    vi.advanceTimersByTime(60_001);

    // Trigger cleanup
    rateLimiter.cleanup();

    // Both should be cleaned up and allow new connections
    expect(rateLimiter.isAllowed(ip1)).toBe(true);
    expect(rateLimiter.isAllowed(ip2)).toBe(true);
  });

  it("should handle multiple IPs independently", () => {
    rateLimiter = new RateLimiter({ maxConnections: 2, windowMs: 60_000 });
    const ip1 = "127.0.0.1";
    const ip2 = "192.168.1.1";

    rateLimiter.isAllowed(ip1);
    rateLimiter.isAllowed(ip1);
    expect(rateLimiter.isAllowed(ip1)).toBe(false);

    // Different IP should still be allowed
    expect(rateLimiter.isAllowed(ip2)).toBe(true);
    expect(rateLimiter.isAllowed(ip2)).toBe(true);
    expect(rateLimiter.isAllowed(ip2)).toBe(false);
  });

  it("should stop cleanup interval on stop()", () => {
    rateLimiter = new RateLimiter(DEFAULT_RATE_LIMIT);
    rateLimiter.stop();

    // Should be safe to call multiple times
    rateLimiter.stop();
  });

  it("should use default rate limit config", () => {
    rateLimiter = new RateLimiter(DEFAULT_RATE_LIMIT);
    const ip = "127.0.0.1";

    // DEFAULT_RATE_LIMIT is 5 connections per 60s
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.isAllowed(ip)).toBe(true);
    }
    expect(rateLimiter.isAllowed(ip)).toBe(false);
  });
});
