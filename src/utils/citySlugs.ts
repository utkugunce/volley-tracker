/**
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
 * /nigde, /usak, /kirikkale gerçek bir HTTP 404 döner.
 */

/** data/cities.json'daki 81 ilden gizli olmayanların slug'ları (alfabetik). */
export const CITY_SLUGS: readonly string[] = [
  "adana",
  "adiyaman",
  "afyon",
  "agri",
  "aksaray",
  "amasya",
  "ankara",
  "antalya",
  "ardahan",
  "artvin",
  "aydin",
  "balikesir",
  "bartin",
  "batman",
  "bayburt",
  "bilecik",
  "bingol",
  "bitlis",
  "bolu",
  "burdur",
  "bursa",
  "canakkale",
  "cankiri",
  "corum",
  "denizli",
  "diyarbakir",
  "duzce",
  "edirne",
  "elazig",
  "erzincan",
  "erzurum",
  "eskisehir",
  "gaziantep",
  "giresun",
  "gumushane",
  "hakkari",
  "hatay",
  "igdir",
  "isparta",
  "istanbul",
  "izmir",
  "kahramanmaras",
  "karabuk",
  "karaman",
  "kars",
  "kastamonu",
  "kayseri",
  "kilis",
  "kirklareli",
  "kirsehir",
  "kocaeli",
  "konya",
  "kutahya",
  "malatya",
  "manisa",
  "mardin",
  "mersin",
  "mugla",
  "mus",
  "nevsehir",
  "ordu",
  "osmaniye",
  "rize",
  "sakarya",
  "samsun",
  "sanliurfa",
  "siirt",
  "sinop",
  "sirnak",
  "sivas",
  "tekirdag",
  "tokat",
  "trabzon",
  "tunceli",
  "van",
  "yalova",
  "yozgat",
  "zonguldak",
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
  "404",
  "admin",
  "dmca",
  "fikstur",
  "giris",
  "gizlilik",
  "grup-durumu",
  "gunun-maclari",
  "hangi-ligde-oynar",
  "istatistikler",
  "kadinlar-2-ligi",
  "karsilastir",
  "kulupler",
  "panel",
  "puan-durumu",
  "sonuclar",
  "takvim",
]);
