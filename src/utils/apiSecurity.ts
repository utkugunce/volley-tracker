import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";

function safeCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  return request.headers.get("x-admin-token") || bearer || null;
}

export function requireConfiguredSecret(
  request: Request,
  secretName: "ADMIN_TOKEN" | "CRON_SECRET"
): NextResponse | null {
  const expected = process.env[secretName]?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: `${secretName} yapılandırılmamış.` },
      { status: 503 }
    );
  }

  const provided = getBearerToken(request);
  if (!provided || !safeCompare(provided, expected)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  return null;
}

export async function getRateLimitResponse(
  request: Request,
  limiter: RateLimiter
): Promise<NextResponse | null> {
  const result = await limiter.check(getClientIp(request));
  if (result.allowed) return null;

  const response = NextResponse.json(
    { error: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin." },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds || 60));
  return response;
}

export function validateSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı" }, { status: 403 });
  }

  return null;
}