/** Hafif iki dilli sözlük: ana gezinme ve başlıklar. Türkçe varsayılan ve geri dönüş dilidir. */
export type Language = "tr" | "en";
export const LANGUAGES: Language[] = ["tr", "en"];
export const DEFAULT_LANGUAGE: Language = "tr";
export const LANGUAGE_STORAGE_KEY = "av-lang";

const tr = {
  "lang.label": "Dil",
  "lang.switchTo": "Switch to English",
  "lang.short": "TR",
  "theme.label": "Tema",
  "theme.system": "Sistem",
  "theme.light": "Açık",
  "theme.dark": "Koyu",
  "common.loading": "Yükleniyor...",
  "common.home": "Ana Sayfa",
  "nav.home": "ANASAYFA",
  "nav.results": "SONUÇLAR",
  "nav.today": "GÜNÜN MAÇLARI",
  "nav.fixtures": "FİKSTÜR",
  "nav.standings": "PUAN DURUMU",
  "nav.groupStatus": "GRUP DURUMU",
  "nav.todayBadge": "Bugün",
  "header.favorites": "Favoriler",
  "header.search": "Ara",
  "header.k2": "Kadınlar 2. Ligi",
  "header.groups16": "16 Grup",
  "header.leagueTagline": "Genç & Yıldız Kızlar Süper Lig",
  "mobile.matches": "Maçlar",
  "mobile.live": "Canlı",
  "mobile.standings": "Puan Durumu",
  "mobile.leagues": "Ligler",
  "mobile.favorites": "Favorilerim",
  "stats.title": "Lig İstatistikleri ve Analiz",
  "stats.compareLink": "Takım Karşılaştır →",
  "stats.all": "Tümü",
  "compare.title": "Takım Karşılaştırma",
  "offline.title": "Çevrimdışısınız",
  "offline.body": "İnternet bağlantısı yok. Daha önce açtığınız sayfalar ve son kaydedilen fikstür verileri kullanılabilir olabilir.",
  "offline.retry": "Tekrar dene",
  "offline.home": "Ana sayfaya dön",
} as const;

export type TranslationKey = keyof typeof tr;

const en: Record<TranslationKey, string> = {
  "lang.label": "Language",
  "lang.switchTo": "Türkçe'ye geç",
  "lang.short": "EN",
  "theme.label": "Theme",
  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "common.loading": "Loading...",
  "common.home": "Home",
  "nav.home": "HOME",
  "nav.results": "RESULTS",
  "nav.today": "TODAY'S MATCHES",
  "nav.fixtures": "FIXTURES",
  "nav.standings": "STANDINGS",
  "nav.groupStatus": "GROUP STATUS",
  "nav.todayBadge": "Today",
  "header.favorites": "Favorites",
  "header.search": "Search",
  "header.k2": "Women's 2nd League",
  "header.groups16": "16 Groups",
  "header.leagueTagline": "Youth & Junior Girls Super League",
  "mobile.matches": "Matches",
  "mobile.live": "Live",
  "mobile.standings": "Standings",
  "mobile.leagues": "Leagues",
  "mobile.favorites": "Favorites",
  "stats.title": "League Statistics & Analysis",
  "stats.compareLink": "Compare Teams →",
  "stats.all": "All",
  "compare.title": "Team Comparison",
  "offline.title": "You are offline",
  "offline.body": "No internet connection. Pages you opened earlier and the last saved fixture data may still be available.",
  "offline.retry": "Try again",
  "offline.home": "Back to home",
};

export const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { tr, en };

export function parseLanguage(value: unknown): Language {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}

/** Anahtarı çevirir; eksik/bilinmeyen anahtarda Türkçe, o da yoksa anahtarın kendisi döner. */
export function translate(language: Language, key: string): string {
  const dict = DICTIONARIES[language] as Record<string, string>;
  const fallback = DICTIONARIES[DEFAULT_LANGUAGE] as Record<string, string>;
  return dict[key] ?? fallback[key] ?? key;
}
