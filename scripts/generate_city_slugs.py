"""
scripts/generate_city_slugs.py

`data/cities.json` içindeki 81 il slug'ından, edge runtime'da (src/proxy.ts)
kullanılacak statik allowlist modülünü üretir:  src/utils/citySlugs.ts

Neden statik bir modül?
  proxy.ts edge runtime'da çalışır; `fs` ile data/cities.json okuyamaz.
  Ayrıca src/utils/cityHelper.ts içindeki isValidCitySlug(), şehir listesi
  okunamadığında "return true" diyen izinli bir fallback'e sahip. Bu ikisi
  birleşince geçersiz her tek segmentli URL HTTP 200 dönüyordu (soft 404).
  Bu modül listeyi derleme anına sabitler ve fallback'i gereksiz kılar.

Kullanım:
    python scripts/generate_city_slugs.py            # yeniden üret
    python scripts/generate_city_slugs.py --check    # sadece sapma var mı bak (CI)

`--check` modunda dosya güncel değilse exit code 1 döner.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
CITIES_JSON = BASE_DIR / "data" / "cities.json"
TARGET = BASE_DIR / "src" / "utils" / "citySlugs.ts"

# src/utils/hiddenCities.ts ile aynı liste. Oradan import edilemez çünkü bu
# script Node değil Python; iki yerin senkron kaldığını citySlugs.test.ts doğrular.
HIDDEN_CITY_SLUGS = {"kirikkale", "usak", "bayburt", "ardahan"}

HEADER = '''/**
 * BU DOSYA OTOMATİK ÜRETİLİR — ELLE DÜZENLEMEYİN.
 *
 * Üreten: `python scripts/generate_city_slugs.py`
 * Kaynak:  `data/cities.json`
 *
 * Edge runtime'da (src/proxy.ts) çalışan şehir rotası allowlist'i. proxy.ts
 * `fs` kullanamadığı için liste derleme anına sabitlenir. Senkronizasyonu
 * `src/utils/__tests__/citySlugs.test.ts` garanti eder: data/cities.json'a yeni
 * bir il eklenir de bu dosya yeniden üretilmezse test kırılır.
 *
 * Gizli iller (src/utils/hiddenCities.ts) listeye DAHİL DEĞİLDİR; böylece
 * /usak, /kirikkale gerçek bir HTTP 404 döner.
 */

/** data/cities.json'daki 81 ilden gizli olmayanların slug'ları (alfabetik). */
export const CITY_SLUGS: readonly string[] = [
{SLUGS}
] as const;

/** Hızlı üyelik testi için türetilmiş küme. */
export const CITY_SLUG_SET: ReadonlySet<string> = new Set(CITY_SLUGS);

/** Şehir slug'ı yerine de geçerli olan takma ad. */
export const CITY_ALIAS_SLUGS: readonly string[] = ["all"] as const;

/**
 * `/{sekme}/{il}` biçimindeki rotaların birinci segmenti.
 * Bu sekmelerin ikinci segmenti bir şehir slug'ı olmak zorundadır.
 * Kaynak: src/app altındaki ilgili [city] dizinleri.
 */
export const CITY_TAB_SEGMENTS: ReadonlySet<string> = new Set([
  "fikstur",
  "grup-durumu",
  "gunun-maclari",
  "kulupler",
  "puan-durumu",
  "sonuclar",
]);

/**
 * src/app altındaki statik (dinamik olmayan) birinci segmentler.
 * Bunlar asla şehir slug'ı gibi doğrulanmaz.
 */
export const STATIC_ROOT_SEGMENTS: ReadonlySet<string> = new Set([
{ROOT_SEGMENTS}
]);
'''


def load_slugs() -> list[str]:
    payload = json.loads(CITIES_JSON.read_text(encoding="utf-8"))
    cities = payload.get("cities")
    if not isinstance(cities, list) or not cities:
        raise SystemExit(f"HATA: {CITIES_JSON} içinde 'cities' listesi bulunamadı.")

    slugs = sorted({str(c["slug"]).strip().lower() for c in cities if c.get("slug")})
    invalid = [s for s in slugs if not s or any(ch not in "abcdefghijklmnopqrstuvwxyz0123456789-" for ch in s)]
    if invalid:
        raise SystemExit(f"HATA: beklenmeyen slug karakterleri: {invalid}")

    return [s for s in slugs if s not in HIDDEN_CITY_SLUGS]


def root_segments() -> list[str]:
    """
    src/app altındaki GERÇEKTEN yönlendirilebilir statik rotalar.

    Yalnızca kökünde `page.tsx` veya `route.ts` bulunan dizinler sayılır.
    Örn. `src/app/takim/` yalnızca `[slug]/` içerdiği için `/takim` adresi
    aslında `/[city]`'e düşer — listeye alınsaydı "/takim" 200 dönmeye devam
    ederdi (canlıda gözlenen "Takim Voleybol Fikstür..." başlığı tam olarak bu).
    """
    app_dir = BASE_DIR / "src" / "app"
    names = set()
    for entry in app_dir.iterdir():
        if not entry.is_dir():
            continue
        if entry.name.startswith("[") or entry.name.startswith("__"):
            continue
        if (entry / "page.tsx").exists() or (entry / "route.ts").exists():
            names.add(entry.name)
    return sorted(names)


def render() -> str:
    slugs = load_slugs()
    slug_block = "\n".join(f'  "{s}",' for s in slugs)
    root_block = "\n".join(f'  "{s}",' for s in root_segments())
    return HEADER.replace("{SLUGS}", slug_block).replace("{ROOT_SEGMENTS}", root_block)


def main() -> int:
    parser = argparse.ArgumentParser(description="citySlugs.ts üreticisi")
    parser.add_argument("--check", action="store_true", help="yazma; sadece sapma varsa 1 dön")
    args = parser.parse_args()

    content = render()

    if args.check:
        current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else None
        if current == content:
            print("✅ citySlugs.ts güncel (data/cities.json ile senkron).")
            return 0
        print("❌ citySlugs.ts bayat. Çalıştırın: python scripts/generate_city_slugs.py")
        return 1

    TARGET.write_text(content, encoding="utf-8")
    print(f"✅ {TARGET.relative_to(BASE_DIR)} üretildi ({len(load_slugs())} il slug'ı).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
