import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "@/utils/club/server";
import { safeNextPath } from "@/utils/club/validation";

const OTP_TYPES: readonly EmailOtpType[] = ["email", "magiclink", "signup", "recovery", "invite", "email_change"];

/**
 * Magic link dönüş adresi. İki biçimi destekler:
 *  - `?code=...` (PKCE; bağlantı, isteğin yapıldığı tarayıcıda açılmalıdır)
 *  - `?token_hash=...&type=email` (Supabase e-posta şablonunda önerilir; her tarayıcıda çalışır)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const failure = (reason: string) =>
    NextResponse.redirect(new URL(`/giris?hata=${reason}`, url.origin), { status: 303 });

  const client = await createSessionClient();
  if (!client) return failure("kurulum");

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  try {
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return failure("gecersiz");
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return failure("gecersiz");
    } else {
      return failure("gecersiz");
    }
  } catch {
    return failure("gecersiz");
  }

  return NextResponse.redirect(new URL(next, url.origin), { status: 303 });
}
