import { NextRequest, NextResponse } from "next/server";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";

/**
 * Bilinen saldırı araçları ve güvenlik açığı tarayıcılarının User-Agent kalıpları.
 */
const MALICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /wpscan/i,
  /acunetix/i,
  /masscan/i,
  /dirbuster/i,
  /nmap/i,
  /nessus/i,
  /gobuster/i,
  /hydra/i,
  /havij/i,
  /zgrab/i,
];

/**
 * Hassas rotalar: brute-force veya yüksek maliyetli tetikleme riski taşıyanlar.
 */
const SENSITIVE_PREFIXES = [
  "/api/auth",
  "/api/sync",
  "/api/fixtures/upload",
  "/giris",
] as const;

/**
 * API rotaları için küresel hız sınırlayıcı (IP başına dakikada 60 istek).
 */
export const globalApiLimiter = new RateLimiter({
  name: "proxy-api",
  windowMs: 60_000,
  maxRequests: 60,
  blockDurationMs: 60_000,
});

/**
 * Genel web sayfaları için hız sınırlayıcı (IP başına dakikada 180 istek).
 */
export const globalPageLimiter = new RateLimiter({
  name: "proxy-page",
  windowMs: 60_000,
  maxRequests: 180,
  blockDurationMs: 60_000,
});

/**
 * Hassas rotalar için sıkı hız sınırlayıcı (IP başına dakikada 15 istek, 5 dk blok).
 */
export const globalSensitiveLimiter = new RateLimiter({
  name: "proxy-sensitive",
  windowMs: 60_000,
  maxRequests: 15,
  blockDurationMs: 300_000,
});

/**
 * İstek yapan istemcinin bilinen bir saldırı tarayıcısı olup olmadığını inceler.
 */
export function isMaliciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MALICIOUS_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Önbelleği delmeye yönelik (Cache-Buster) aşırı sorgu parametrelerini tespit eder.
 * Normal ziyaretçiler veya SEO robotları bu kadar uzun veya fazla parametre göndermez.
 */
export function isExcessiveQuery(url: URL): boolean {
  if (url.search.length > 500) return true;
  let count = 0;
  for (const _ of url.searchParams.keys()) {
    count++;
    if (count > 10) return true;
  }
  return false;
}

/**
 * Güvenlik başlıklarını yanıta enjekte eder.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export interface SecurityEvaluation {
  blocked: boolean;
  response?: NextResponse;
}

/**
 * Tüm gelen istekleri DoS, tarayıcı ve aşırı yük açısından değerlendirir.
 */
export async function evaluateSecurity(request: NextRequest): Promise<SecurityEvaluation> {
  // Test ortamında diğer birim testlerin engellenmemesi için x-test-security başlığı olmadıkça atla
  if (process.env.NODE_ENV === "test" && request.headers.get("x-test-security") !== "1") {
    return { blocked: false };
  }

  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");

  // 1. Bilinen zararlı tarayıcı kontrolü
  if (isMaliciousUserAgent(userAgent)) {
    return {
      blocked: true,
      response: new NextResponse(
        JSON.stringify({ error: "Erişim engellendi." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 2. Cache-Buster / DoS parametre seli kontrolü
  if (isExcessiveQuery(request.nextUrl)) {
    return {
      blocked: true,
      response: new NextResponse(
        JSON.stringify({ error: "Geçersiz veya aşırı uzun sorgu parametreleri." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 3. Rota tipine göre hız sınırlama (Rate Limiting)
  const ip = getClientIp(request);
  let limiter: RateLimiter;

  if (SENSITIVE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    limiter = globalSensitiveLimiter;
  } else if (pathname.startsWith("/api/")) {
    limiter = globalApiLimiter;
  } else {
    limiter = globalPageLimiter;
  }

  const limitResult = await limiter.check(ip);
  if (!limitResult.allowed) {
    const retryAfter = limitResult.retryAfterSeconds ?? 60;
    const isApi = pathname.startsWith("/api/");
    const body = isApi
      ? JSON.stringify({ error: "Çok fazla istek gönderildi. Lütfen bekleyin.", retryAfter })
      : "Çok fazla istek gönderildi. Lütfen bekleyin.";

    const headers: Record<string, string> = {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Remaining": "0",
    };
    if (isApi) {
      headers["Content-Type"] = "application/json";
    }

    return {
      blocked: true,
      response: new NextResponse(body, { status: 429, headers }),
    };
  }

  return { blocked: false };
}
