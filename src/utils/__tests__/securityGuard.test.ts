import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  evaluateSecurity,
  isMaliciousUserAgent,
  isExcessiveQuery,
  applySecurityHeaders,
  globalApiLimiter,
  globalSensitiveLimiter,
} from "../securityGuard";

const BASE_URL = "https://altyapivoleybol.com.tr";

function makeReq(
  pathname: string,
  options: {
    headers?: Record<string, string>;
    search?: string;
  } = {}
): NextRequest {
  const url = new URL(`${pathname}${options.search ? `?${options.search}` : ""}`, BASE_URL);
  const headers = new Headers({
    "x-test-security": "1", // Test ortamında evaluateSecurity'yi etkinleştir
    ...(options.headers || {}),
  });
  return new NextRequest(url, { headers });
}

describe("securityGuard — Zararlı Tarayıcı ve Bot Koruması", () => {
  it("bilinen saldırı tarayıcılarını tespit eder", () => {
    expect(isMaliciousUserAgent("sqlmap/1.5.2#stable")).toBe(true);
    expect(isMaliciousUserAgent("Mozilla/5.0 (compatible; Nikto/2.1.6)")).toBe(true);
    expect(isMaliciousUserAgent("WPScan v3.8.22")).toBe(true);
    expect(isMaliciousUserAgent("masscan/1.0")).toBe(true);
    expect(isMaliciousUserAgent("dirbuster-1.0-RC1")).toBe(true);
    expect(isMaliciousUserAgent("gobuster/3.1.0")).toBe(true);
  });

  it("normal kullanıcı tarayıcılarını ve arama motorlarını engellemez", () => {
    expect(isMaliciousUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")).toBe(false);
    expect(isMaliciousUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(false);
    expect(isMaliciousUserAgent(null)).toBe(false);
  });

  it("zararlı tarayıcı ile gelen istek 403 Forbidden alır", async () => {
    const req = makeReq("/api/cities", {
      headers: { "user-agent": "sqlmap/1.5.2" },
    });
    const result = await evaluateSecurity(req);
    expect(result.blocked).toBe(true);
    expect(result.response?.status).toBe(403);
  });
});

describe("securityGuard — Cache-Buster ve Sorgu Seli Koruması", () => {
  it("aşırı sayıda parametre içeren sorguları engeller", () => {
    const params = new URLSearchParams();
    for (let i = 0; i < 15; i++) {
      params.set(`spam_${i}`, `val_${i}`);
    }
    const url = new URL(`https://example.com/fikstur?${params.toString()}`);
    expect(isExcessiveQuery(url)).toBe(true);
  });

  it("aşırı uzun sorgu dizesini engeller", () => {
    const url = new URL(`https://example.com/fikstur?rand=${"a".repeat(600)}`);
    expect(isExcessiveQuery(url)).toBe(true);
  });

  it("makul sorgu parametrelerine izin verir", () => {
    const url = new URL("https://example.com/fikstur?city=istanbul&tab=genc-kizlar");
    expect(isExcessiveQuery(url)).toBe(false);
  });

  it("aşırı sorgu ile gelen istek 400 Bad Request alır", async () => {
    const req = makeReq("/fikstur", {
      search: `flood=${"x".repeat(600)}`,
    });
    const result = await evaluateSecurity(req);
    expect(result.blocked).toBe(true);
    expect(result.response?.status).toBe(400);
  });
});

describe("securityGuard — Güvenlik Başlıkları (Defense in Depth)", () => {
  it("temel güvenlik başlıklarını yanıta ekler", () => {
    const req = makeReq("/istanbul");
    const res = makeReq("/istanbul");
    const response = applySecurityHeaders(new (require("next/server").NextResponse)("ok"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});

describe("securityGuard — Hız Sınırı (Rate Limiting)", () => {
  const TEST_IP = "192.0.2.111";

  beforeEach(async () => {
    await globalApiLimiter.reset(TEST_IP);
    await globalSensitiveLimiter.reset(TEST_IP);
  });

  it("hassas rotalarda (ör. /api/auth) 15 istekten sonrasını 429 ile engeller", async () => {
    for (let i = 0; i < 15; i++) {
      const req = makeReq("/api/auth/magic-link", {
        headers: { "x-forwarded-for": TEST_IP },
      });
      const res = await evaluateSecurity(req);
      expect(res.blocked).toBe(false);
    }

    // 16. istek engellenmelidir
    const blockedReq = makeReq("/api/auth/magic-link", {
      headers: { "x-forwarded-for": TEST_IP },
    });
    const blockedRes = await evaluateSecurity(blockedReq);
    expect(blockedRes.blocked).toBe(true);
    expect(blockedRes.response?.status).toBe(429);
    expect(blockedRes.response?.headers.get("Retry-After")).toBeTruthy();
  });

  it("Cloudflare cf-connecting-ip başlığı öncelikli olarak kullanılır", async () => {
    const CF_IP = "198.51.100.99";
    await globalSensitiveLimiter.reset(CF_IP);

    for (let i = 0; i < 15; i++) {
      const req = makeReq("/api/auth/me", {
        headers: {
          "cf-connecting-ip": CF_IP,
          "x-forwarded-for": "10.0.0.1",
        },
      });
      await evaluateSecurity(req);
    }

    const limited = await evaluateSecurity(
      makeReq("/api/auth/me", {
        headers: {
          "cf-connecting-ip": CF_IP,
          "x-forwarded-for": "10.0.0.1",
        },
      })
    );
    expect(limited.blocked).toBe(true);
    expect(limited.response?.status).toBe(429);
  });
});
