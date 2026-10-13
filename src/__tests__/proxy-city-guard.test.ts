import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";

/**
 * proxy.ts (middleware) entegrasyon testleri.
 *
 * Amaç: geçersiz/gizli il adreslerinin GERÇEK HTTP 404 ile dönmesi ve bu
 * arada herkese açık sayfaların ISR önbelleğinin bozulmaması.
 *
 * Eski davranışta bu adresler 200 dönüyordu; sayfa içindeki notFound()
 * loading.tsx kabuğu flush edildikten sonra çalıştığı için status
 * değiştirilemiyordu.
 */

const SITE = "https://altyapivoleybol.com.tr";

function req(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, SITE));
}

async function callProxy(pathname: string) {
  const response = await proxy(req(pathname));
  return {
    status: response.status,
    rewrite: response.headers.get("x-middleware-rewrite"),
    cacheControl: response.headers.get("cache-control"),
  };
}

describe("proxy — şehir bekçisi gerçek 404 döner", () => {
  const blockedPaths = [
    "/definitely-not-a-page-xyz",
    "/foobar-invalid-city",
    "/takim",
    "/nigde",
    "/usak",
    "/kirikkale",
    "/sonuclar/xyz-gecersiz",
    "/fikstur/foobar",
    "/kulupler/olmayan-sehir-xyz",
  ];

  it.each(blockedPaths.map((p) => [p] as [string]))(
    "%s -> 404 + /404 rewrite",
    async (pathname) => {
      const res = await callProxy(pathname);
      expect(res.status, `${pathname} 404 dönmedi`).toBe(404);
      expect(res.rewrite).toContain("/404");
    },
  );

  it("rewrite hedefi sorgu dizesi taşımaz (cache anahtarı kirlenmez)", async () => {
    const response = await proxy(req("/nigde?utm_source=x"));
    const rewrite = response.headers.get("x-middleware-rewrite") ?? "";
    expect(response.status).toBe(404);
    expect(rewrite).not.toContain("utm_source");
  });
});

describe("proxy — geçerli adresler dokunulmadan geçer", () => {
  const passedPaths = [
    "/",
    "/istanbul",
    "/all",
    "/fikstur",
    "/fikstur/istanbul",
    "/sonuclar/izmir",
    "/kulupler/istanbul/kadikoy",
    "/takim/vakifbank-u18-t19499",
    "/lig/istanbul/genc-kizlar",
    "/kadinlar-2-ligi/puan-durumu",
    "/admin",
    "/404",
    "/icon.svg",
    "/sw.js",
    "/robots.txt",
    "/api/health",
    "/api/fixtures",
  ];

  it.each(passedPaths.map((p) => [p] as [string]))("%s -> 200, rewrite yok", async (pathname) => {
    const res = await callProxy(pathname);
    expect(res.status, `${pathname} yanlışlıkla engellendi`).toBe(200);
    expect(res.rewrite).toBeNull();
  });
});

describe("proxy — ISR önbelleği korunur", () => {
  it("herkese açık sayfalar 'no-store' ALMAZ (Supabase tanımsızken)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    for (const pathname of ["/istanbul", "/fikstur/istanbul", "/panel", "/giris"]) {
      const res = await callProxy(pathname);
      expect(res.cacheControl, `${pathname} için no-store set edildi`).toBeNull();
    }
  });

  it("oturum çerezi olmayan panel isteği Supabase'e dokunmadan geçer", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const res = await callProxy("/panel");
    expect(res.status).toBe(200);
    expect(res.cacheControl).toBeNull();

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });
});

describe("proxy — matcher kapsamı", () => {
  const matcher = config.matcher as string[];

  it("şehir bekçisinin ihtiyaç duyduğu tüm rotaları kapsar", () => {
    expect(matcher).toContain("/:cityCandidate");
    for (const tab of ["fikstur", "grup-durumu", "gunun-maclari", "puan-durumu", "sonuclar", "kulupler"]) {
      expect(matcher, `/${tab}/:tabCity matcher'da yok`).toContain(`/${tab}/:tabCity`);
    }
    expect(matcher).toContain("/kulupler/:tabCity/:district");
  });

  it("orijinal oturum-yenileme kapsamı korunuyor", () => {
    for (const entry of ["/panel/:path*", "/giris", "/api/panel/:path*", "/api/auth/:path*"]) {
      expect(matcher, `${entry} matcher'dan düşmüş`).toContain(entry);
    }
  });

  it("_next/* statik varlıkları matcher'a GİRMEZ (gereksiz edge çağrısı olmasın)", () => {
    for (const entry of matcher) {
      expect(entry, `${entry} _next varlıklarını yakalıyor`).not.toContain("_next");
      expect(entry.startsWith("/")).toBe(true);
    }
  });
});
