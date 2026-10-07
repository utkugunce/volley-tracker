/**
 * Rate limiting utility for API endpoints and brute-force protection.
 *
 * İki arka uç desteklenir:
 * - **Upstash Redis (dağıtık):** `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN`
 *   tanımlıysa sabit pencereli (fixed window) INCR + PEXPIRE sayaçları Upstash REST API
 *   üzerinden tutulur. Böylece sunucusuz (serverless) örnekler arasında limit paylaşılır.
 * - **Bellek içi (fallback):** Ortam değişkenleri yoksa veya Upstash'e ulaşılamazsa
 *   örnek başına `Map` kullanılır (yerel geliştirme / tek süreç).
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  /**
   * Dağıtık arka uçta anahtar ön eki. Aynı anahtarı (ör. IP) kullanan farklı
   * limiter'ların birbirinin sayacını etkilememesi için benzersiz olmalıdır.
   */
  name?: string;
}

const UPSTASH_TIMEOUT_MS = 1500;
const KEY_PREFIX = "rl";

interface UpstashConfig {
  url: string;
  token: string;
}

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function isDistributedRateLimitEnabled(): boolean {
  return getUpstashConfig() !== null;
}

type UpstashCommand = (string | number)[];
type UpstashPipelineResult = { result?: unknown; error?: string }[];

async function upstashPipeline(
  config: UpstashConfig,
  commands: UpstashCommand[]
): Promise<UpstashPipelineResult> {
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Upstash REST hatası: ${res.status}`);
  }
  const data = (await res.json()) as UpstashPipelineResult;
  if (!Array.isArray(data)) {
    throw new Error("Upstash REST beklenmeyen yanıt");
  }
  const failed = data.find((item) => item && item.error);
  if (failed) {
    throw new Error(`Upstash komut hatası: ${failed.error}`);
  }
  return data;
}

export class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDurationMs: number;
  private readonly name: string;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.blockDurationMs = options.blockDurationMs || 0;
    this.name =
      options.name || `default:${options.windowMs}:${options.maxRequests}:${this.blockDurationMs}`;
  }

  /**
   * Checks if an IP or identifier is rate-limited.
   * Upstash yapılandırılmışsa dağıtık sayaç, değilse bellek içi sayaç kullanılır.
   */
  async check(key: string): Promise<RateLimitResult> {
    const config = getUpstashConfig();
    if (config) {
      try {
        return await this.checkDistributed(config, key);
      } catch (err) {
        console.warn("Dağıtık rate limit kontrolü başarısız, bellek içi limite dönülüyor:", err);
      }
    }
    return this.checkLocal(key);
  }

  /**
   * Bellek içi (örnek başına) kontrol. Senkron ve yalnızca tek süreç içinde geçerlidir.
   */
  checkLocal(key: string): RateLimitResult {
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

  private windowKey(key: string, windowIndex: number): string {
    return `${KEY_PREFIX}:${this.name}:${key}:${windowIndex}`;
  }

  private blockKey(key: string): string {
    return `${KEY_PREFIX}:${this.name}:${key}:block`;
  }

  private async checkDistributed(config: UpstashConfig, key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowIndex = Math.floor(now / this.windowMs);
    const windowEnd = (windowIndex + 1) * this.windowMs;
    const counterKey = this.windowKey(key, windowIndex);
    const blockKey = this.blockKey(key);

    const commands: UpstashCommand[] = [];
    if (this.blockDurationMs > 0) {
      commands.push(["PTTL", blockKey]);
    }
    commands.push(["INCR", counterKey]);
    commands.push(["PEXPIRE", counterKey, this.windowMs]);

    const results = await upstashPipeline(config, commands);
    let offset = 0;

    if (this.blockDurationMs > 0) {
      const blockTtl = Number(results[0]?.result);
      offset = 1;
      if (Number.isFinite(blockTtl) && blockTtl > 0) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(blockTtl / 1000)),
        };
      }
    }

    const count = Number(results[offset]?.result);
    if (!Number.isFinite(count)) {
      throw new Error("Upstash INCR sonucu okunamadı");
    }

    if (count > this.maxRequests) {
      if (this.blockDurationMs > 0) {
        await upstashPipeline(config, [["SET", blockKey, "1", "PX", this.blockDurationMs, "NX"]]);
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(this.blockDurationMs / 1000)),
        };
      }
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
      };
    }

    return { allowed: true, remaining: Math.max(0, this.maxRequests - count) };
  }

  /**
   * Resets rate limit for a specific key (e.g., after successful login)
   */
  async reset(key: string): Promise<void> {
    this.records.delete(key);
    const config = getUpstashConfig();
    if (!config) return;
    const windowIndex = Math.floor(Date.now() / this.windowMs);
    try {
      await upstashPipeline(config, [
        ["DEL", this.windowKey(key, windowIndex), this.blockKey(key)],
      ]);
    } catch (err) {
      console.warn("Dağıtık rate limit sıfırlama başarısız:", err);
    }
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
