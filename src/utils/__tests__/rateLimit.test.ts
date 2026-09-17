import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimiter, getClientIp } from "../rateLimit";

describe("RateLimiter utility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests up to maxRequests", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 3 });
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(false);
  });

  it("resets count after windowMs expires", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 2 });
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(false);

    vi.advanceTimersByTime(60001);
    expect(limiter.check("ip-1").allowed).toBe(true);
  });

  it("enforces block duration if specified", () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 2,
      blockDurationMs: 300000, // 5 min block
    });
    limiter.check("ip-1");
    limiter.check("ip-1");
    const blocked = limiter.check("ip-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // After 2 minutes, still blocked
    vi.advanceTimersByTime(120000);
    expect(limiter.check("ip-1").allowed).toBe(false);

    // After 5 minutes, block lifted
    vi.advanceTimersByTime(180001);
    expect(limiter.check("ip-1").allowed).toBe(true);
  });

  it("extracts client IP from x-forwarded-for header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip or default", () => {
    const req1 = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.1" },
    });
    expect(getClientIp(req1)).toBe("198.51.100.1");

    const req2 = new Request("https://example.com");
    expect(getClientIp(req2)).toBe("127.0.0.1");
  });
});
