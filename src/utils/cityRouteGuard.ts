import { slugify } from "./slugify";
import {
  CITY_ALIAS_SLUGS,
  CITY_SLUG_SET,
  CITY_TAB_SEGMENTS,
  STATIC_ROOT_SEGMENTS,
} from "./citySlugs";

/**
 * Şehir rotası bekçisi (city route guard).
 *
 * Neden var?
 *   `src/app/[city]/page.tsx` geçersiz slug'larda `notFound()` çağırıyor ve bu
 *   doğru çalışıyor; ama `src/app/loading.tsx` bir Suspense sınırı kurduğu için
 *   sayfa kabuğu HTTP 200 ile çoktan flush edilmiş oluyor. Status kodu artık
 *   değiştirilemediğinden `/olmayan-bir-adres` ve gizli iller (`/nigde`, `/usak`,
 *   `/kirikkale`) 200 dönüyordu (soft 404).
 *
 *   proxy.ts (middleware) stream başlamadan ÖNCE çalıştığı için status kodu
 *   burada gerçekten kontrol edilebilir. Bu modül o kontrolün saf (framework'süz)
 *   mantığını tutar; böylece NextRequest'e ihtiyaç duymadan test edilebilir ve
 *   edge runtime'da güvenle çalışır (fs/node importu yok).
 *
 * Kapsam dışı: `/takim/[slug]` ve `/lig/[...slug]` gibi veri kümesinden
 * doğrulama gerektiren rotalar. Onlar kendi `notFound()`/`noindex` akışlarında
 * bırakıldı (bkz. değerlendirme raporu, P0-1 notları).
 */

export interface CityRouteDecision {
  /** true ise istek gerçek bir HTTP 404'e rewrite edilmeli. */
  blocked: boolean;
  /** Kararın gerekçesi (log/test için). */
  reason?: "unknown-city" | "hidden-city" | "unknown-tab-city";
  /** İncelenen segment. */
  segment?: string;
}

const PASS: CityRouteDecision = { blocked: false };

/** Path'ten segmentleri çıkarır: "/fikstur/istanbul" -> ["fikstur", "istanbul"] */
export function splitPathname(pathname: string): string[] {
  return pathname.split("/").filter((s) => s.length > 0);
}

/**
 * Bir segment statik bir dosya adı mı? (favicon.ico, sw.js, sitemap.xml, ...)
 * Nokta içeren segmentler Next.js'te dosya olarak ele alınır; şehir slug'ları
 * asla nokta içermez (validate: /^[a-z0-9-]+$/).
 */
function looksLikeFile(segment: string): boolean {
  return segment.includes(".");
}

/** Next.js iç yolları ve gizli segmentler. */
function isInternalSegment(segment: string): boolean {
  return segment.startsWith("_") || segment.startsWith(".");
}

/**
 * Slug, sitenin geçerli bir şehir adresi mi?
 * `cityHelper.isValidCitySlug` ile aynı sözleşme: "all" geçerli, gizli iller
 * geçersiz. Farkı: liste boşken "her şey geçerli" demez (fail-closed).
 */
export function isAllowedCitySlug(rawSlug: string): boolean {
  const decoded = safeDecode(rawSlug);
  if (!decoded) return false;
  const clean = slugify(decoded);
  if (!clean) return false;
  if (CITY_ALIAS_SLUGS.includes(clean)) return true;
  return CITY_SLUG_SET.has(clean);
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Bozuk percent-encoding (ör. "%zz") — geçersiz say, çökme.
    return segment;
  }
}

/**
 * Tek segmentli (`/{city}`) ve `/{sekme}/{city}` yollarını doğrular.
 * Statik rotalar, dosyalar ve iç yollar dokunulmadan geçer.
 */
export function evaluateCityRoute(pathname: string): CityRouteDecision {
  const segments = splitPathname(pathname);
  if (segments.length === 0) return PASS;

  const [first, second, third] = segments;
  if (isInternalSegment(first)) return PASS;

  // 1) Tek segment: "/istanbul" geçerli, "/nigde" ve "/uydurma" geçersiz.
  if (segments.length === 1) {
    if (looksLikeFile(first)) return PASS; // favicon.ico, sw.js, llms.txt ...
    if (STATIC_ROOT_SEGMENTS.has(first)) return PASS; // /admin, /fikstur, /panel ...
    if (isAllowedCitySlug(first)) return PASS;
    return { blocked: true, reason: "unknown-city", segment: first };
  }

  // 2) "/{sekme}/{il}": ikinci segment şehir slug'ı olmalı.
  if (segments.length === 2 && CITY_TAB_SEGMENTS.has(first)) {
    if (looksLikeFile(second)) return PASS;
    if (isAllowedCitySlug(second)) return PASS;
    return { blocked: true, reason: "unknown-tab-city", segment: second };
  }

  // 3) "/kulupler/{il}/{ilce}": yalnızca il segmenti doğrulanır.
  if (segments.length === 3 && first === "kulupler") {
    if (looksLikeFile(second)) return PASS;
    if (isAllowedCitySlug(second)) return PASS;
    return { blocked: true, reason: "unknown-tab-city", segment: second };
  }

  // Geri kalan her şey (çok segmentli rotalar, /takim/*, /lig/*, /api/*) dokunulmadan geçer.
  void third;
  return PASS;
}
