import { NextResponse } from "next/server";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";
import { normalizeEmail, safeNextPath } from "@/utils/club/validation";
import {
  createSessionClient,
  guardMutation,
  isAuthConfigured,
  notConfiguredResponse,
  rateLimited,
  readJsonBody,
} from "@/utils/club/server";

// E-posta bombardımanını önlemek için hem IP hem e-posta başına sınır (Supabase'in kendi sınırına ek).
const ipLimiter = new RateLimiter({ windowMs: 10 * 60_000, maxRequests: 6 });
const emailLimiter = new RateLimiter({ windowMs: 10 * 60_000, maxRequests: 3 });

export async function POST(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;

  if (!isAuthConfigured()) return notConfiguredResponse();

  const ipCheck = ipLimiter.check(getClientIp(request));
  if (!ipCheck.allowed) return rateLimited(ipCheck.retryAfterSeconds);

  const body = (await readJsonBody(request, 2_000)) as { email?: unknown; next?: unknown } | null;
  const email = normalizeEmail(body?.email);
  if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });

  const emailCheck = emailLimiter.check(email.value);
  if (!emailCheck.allowed) return rateLimited(emailCheck.retryAfterSeconds);

  const client = await createSessionClient();
  if (!client) return notConfiguredResponse();

  const origin = new URL(request.url).origin;
  const next = safeNextPath(body?.next);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await client.auth.signInWithOtp({
    email: email.value,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });

  if (error) {
    console.error("[club] magic link gönderilemedi:", error.message);
    // Supabase tarafı hız sınırı vb. durumlarda kullanıcıya genel mesaj
    const status = error.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: "Giriş bağlantısı şu anda gönderilemedi. Lütfen biraz sonra tekrar deneyin." },
      { status }
    );
  }

  // E-posta kayıtlı olsun olmasın aynı yanıt (hesap varlığı sızdırılmaz).
  return NextResponse.json({ ok: true });
}
