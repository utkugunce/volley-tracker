import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, getClientIp, isDistributedRateLimitEnabled } from "../rateLimit";

describe("RateLimiter utility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to maxRequests", async () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 3 });
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(false);
  });

  it("resets count after windowMs expires", async () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 2 });
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(false);

    vi.advanceTimersByTime(60001);
    expect((await limiter.check("ip-1")).allowed).toBe(true);
  });

  it("enforces block duration if specified", async () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 2,
      blockDurationMs: 300000, // 5 min block
    });
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    const blocked = await limiter.check("ip-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // After 2 minutes, still blocked
    vi.advanceTimersByTime(120000);
    expect((await limiter.check("ip-1")).allowed).toBe(false);

    // After 5 minutes, block lifted
    vi.advanceTimersByTime(180001);
    expect((await limiter.check("ip-1")).allowed).toBe(true);
  });

  it("reset clears the in-memory counter", async () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(false);
    await limiter.reset("ip-1");
    expect((await limiter.check("ip-1")).allowed).toBe(true);
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

describe("RateLimiter Upstash (dağıtık) arka ucu", () => {
  // Basit sahte Redis: INCR / PEXPIRE / PTTL / SET PX NX / DEL komutlarını destekler.
  let store: Map<string, { value: number; expiresAt: number | null }>;
  let fetchMock: ReturnType<typeof vi.fn>;

  function alive(key: string) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry;
  }

  function runCommand(cmd: (string | number)[]): unknown {
    const [op, key, ...args] = cmd;
    const k = String(key);
    switch (String(op).toUpperCase()) {
      case "INCR": {
        const entry = alive(k) || { value: 0, expiresAt: null };
        entry.value += 1;
        store.set(k, entry);
        return entry.value;
      }
      case "PEXPIRE": {
        const entry = alive(k);
        if (!entry) return 0;
        entry.expiresAt = Date.now() + Number(args[0]);
        return 1;
      }
      case "PTTL": {
        const entry = alive(k);
        if (!entry) return -2;
        return entry.expiresAt === null ? -1 : entry.expiresAt - Date.now();
      }
      case "SET": {
        const px = Number(args[2]);
        if (alive(k)) return null;
        store.set(k, { value: 1, expiresAt: Date.now() + px });
        return "OK";
      }
      case "DEL": {
        let removed = 0;
        for (const name of [k, ...args.map(String)]) {
          if (store.delete(name)) removed++;
        }
        return removed;
      }
      default:
        throw new Error(`unsupported ${op}`);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    store = new Map();
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example.com/";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://upstash.example.com/pipeline");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
      const commands = JSON.parse(String(init.body)) as (string | number)[][];
      const results = commands.map((cmd) => ({ result: runCommand(cmd) }));
      return new Response(JSON.stringify(results), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("ortam değişkenleri varsa dağıtık arka ucu etkinleştirir", () => {
    expect(isDistributedRateLimitEnabled()).toBe(true);
  });

  it("limiter örnekleri arasında sayacı paylaşır (serverless örnekleri gibi)", async () => {
    const a = new RateLimiter({ name: "shared", windowMs: 60000, maxRequests: 2 });
    const b = new RateLimiter({ name: "shared", windowMs: 60000, maxRequests: 2 });
    expect((await a.check("ip-1")).allowed).toBe(true);
    expect((await b.check("ip-1")).allowed).toBe(true);
    const third = await a.check("ip-1");
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("farklı isimli limiter'lar birbirini etkilemez", async () => {
    const a = new RateLimiter({ name: "a", windowMs: 60000, maxRequests: 1 });
    const b = new RateLimiter({ name: "b", windowMs: 60000, maxRequests: 1 });
    expect((await a.check("ip-1")).allowed).toBe(true);
    expect((await b.check("ip-1")).allowed).toBe(true);
    expect((await a.check("ip-1")).allowed).toBe(false);
  });

  it("blok süresini dağıtık olarak uygular ve reset ile kaldırır", async () => {
    const limiter = new RateLimiter({
      name: "block",
      windowMs: 60000,
      maxRequests: 1,
      blockDurationMs: 300000,
    });
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(false);

    // Yeni pencereye geçilse de blok sürer
    vi.advanceTimersByTime(120000);
    const stillBlocked = await limiter.check("ip-1");
    expect(stillBlocked.allowed).toBe(false);
    expect(stillBlocked.retryAfterSeconds).toBeGreaterThan(0);

    await limiter.reset("ip-1");
    expect((await limiter.check("ip-1")).allowed).toBe(true);
  });

  it("Upstash erişilemezse bellek içi limite döner", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const limiter = new RateLimiter({ name: "fallback", windowMs: 60000, maxRequests: 1 });
    expect((await limiter.check("ip-1")).allowed).toBe(true);
    expect((await limiter.check("ip-1")).allowed).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
