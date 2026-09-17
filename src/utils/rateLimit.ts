/**
 * In-memory rate limiting utility for API endpoints and brute-force protection.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

export class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDurationMs: number;

  constructor(options: {
    windowMs: number;
    maxRequests: number;
    blockDurationMs?: number;
  }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.blockDurationMs = options.blockDurationMs || 0;
  }

  /**
   * Checks if an IP or identifier is rate-limited.
   * Returns { allowed: boolean, remaining: number, retryAfterSeconds?: number }
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds?: number;
  } {
    const now = Date.now();
    const record = this.records.get(key);

    // If currently blocked
    if (record?.blockedUntil && now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    // If window expired or new key
    if (!record || now > record.resetTime) {
      this.records.set(key, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // If limit exceeded
    if (record.count >= this.maxRequests) {
      if (this.blockDurationMs > 0 && !record.blockedUntil) {
        record.blockedUntil = now + this.blockDurationMs;
      }
      const retryAfter = Math.ceil(
        ((record.blockedUntil || record.resetTime) - now) / 1000
      );
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
    }

    record.count++;
    return { allowed: true, remaining: this.maxRequests - record.count };
  }

  /**
   * Resets rate limit for a specific key (e.g., after successful login)
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Cleans up expired records to prevent memory leak
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (
        now > record.resetTime &&
        (!record.blockedUntil || now > record.blockedUntil)
      ) {
        this.records.delete(key);
      }
    }
  }
}

/**
 * Extracts client IP from standard proxy headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}
