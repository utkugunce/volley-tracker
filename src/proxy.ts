import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { evaluateCityRoute } from "@/utils/cityRouteGuard";
import { evaluateSecurity, applySecurityHeaders } from "@/utils/securityGuard";

/**
 * Üç bağımsız görev:
 *
 * 1) GÜVENLİK, DOS VE HIZ SINIRI BEKÇİSİ (Rate Limiting & Security Guard)
 *    Zararlı tarayıcıları, aşırı sorgu seli (cache-buster flood) ve IP başına
 *    aşırı istekleri (DDoS / brute-force) engeller, güvenlik başlıklarını uygular.
 *
 * 2) ŞEHİR ROTASI BEKÇİSİ (HTTP 404)
 *    Geçersiz/gizli il adreslerini stream başlamadan önce gerçek bir 404'e
 *    çevirir. Sayfa içindeki `notFound()` bunu yapamaz: `src/app/loading.tsx`
 *    Suspense kabuğunu 200 ile flush ettiği için status kodu sonradan
 *    değiştirilemiyor (soft 404). Ayrıntı: src/utils/cityRouteGuard.ts
 *
 * 3) SUPABASE OTURUM YENİLEME
 *    Yalnızca panel/giriş rotalarında Supabase oturum çerezini yeniler (süresi
 *    dolan erişim jetonu). Herkese açık sayfalar bu eşleşmenin dışındadır ve
 *    etkilenmez — özellikle ISR önbelleğini bozmamak için `no-store` başlığı
 *    yalnızca bu rotalarda set edilir. Supabase tanımlı değilse ya da oturum
 *    çerezi yoksa hiçbir şey yapmadan geçer.
 */

/** Oturum yenilemenin geçerli olduğu yol önekleri (eski matcher kapsamıyla birebir aynı). */
const SESSION_REFRESH_PREFIXES = ["/panel", "/giris", "/api/panel", "/api/auth"] as const;

function needsSessionRefresh(pathname: string): boolean {
  return SESSION_REFRESH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Geçersiz şehir adresi -> /404 içeriği, gerçek 404 status'u ile. */
function cityNotFound(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/404";
  url.search = "";
  return NextResponse.rewrite(url, { status: 404 });
}

async function refreshPanelSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!url || !anonKey || !hasAuthCookie) return NextResponse.next();

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    await supabase.auth.getUser();
  } catch {
    return NextResponse.next();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  // 1. Güvenlik, DoS ve Hız Sınırı (Rate Limiting) Kontrolü
  const sec = await evaluateSecurity(request);
  if (sec.blocked && sec.response) {
    return applySecurityHeaders(sec.response);
  }

  const { pathname } = request.nextUrl;

  const decision = evaluateCityRoute(pathname);
  if (decision.blocked) return applySecurityHeaders(cityNotFound(request));
  if (decision.redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = decision.redirectTo;
    return applySecurityHeaders(NextResponse.redirect(url, 308));
  }

  if (needsSessionRefresh(pathname)) {
    const sessionRes = await refreshPanelSession(request);
    return applySecurityHeaders(sessionRes);
  }

  const nextRes = NextResponse.next();
  return applySecurityHeaders(nextRes);
}

export const config = {
  matcher: [
    // (2) Oturum yenileme — orijinal kapsam, değişmedi.
    "/panel/:path*",
    "/giris",
    "/api/panel/:path*",
    "/api/auth/:path*",

    // (1) Şehir bekçisi — tek segmentli yollar (/[city]).
    // Statik rotalar (/admin, /fikstur, ...) ve dosyalar (/icon.svg, /sw.js, ...)
    // cityRouteGuard içinde atlanır; _next/* çok segmentli olduğu için hiç eşleşmez.
    "/:cityCandidate",

    // (1) /{sekme}/{il} ve /kulupler/{il}/{ilce}
    "/fikstur/:tabCity",
    "/grup-durumu/:tabCity",
    "/gunun-maclari/:tabCity",
    "/puan-durumu/:tabCity",
    "/sonuclar/:tabCity",

    // Eski /{il}/{sekme} adresleri -> 308 /{sekme}/{il}
    "/:legacyCity/fikstur",
    "/:legacyCity/grup-durumu",
    "/:legacyCity/gunun-maclari",
    "/:legacyCity/puan-durumu",
    "/:legacyCity/sonuclar",

    // (3) DoS ve Bot Güvenlik Kalkanı: Tüm API rotaları
    "/api/:path*",
  ],
};
