/**
 * Vodafone Sultanlar Ligi (kadınlar en üst lig) için abone olunabilir iCalendar (.ics) akışı.
 *
 * Veri kaynağı: tvf.org.tr/lig/sultanlar-ligi?sekme=fikstur sayfasındaki Livewire `wire:snapshot`
 * JSON'u (TVF'nin resmi fikstürü; `leagueFixture`). Depodaki senkronizasyon (`data/*.json`) Sultanlar
 * Ligi'ni içermediğinden bu akış doğrudan TVF'den okur; TVF yeni haftaları yayınladıkça
 * ya da saat/salon değiştirdikçe akış kendiliğinden güncellenir. Veri uydurulmaz: TVF'nin yayınlamadığı
 * haftalar akışta yer almaz.
 */

export const SULTANLAR_SOURCE_URL = "https://tvf.org.tr/lig/sultanlar-ligi?sekme=fikstur";
export const SULTANLAR_PRODID = "-//altyapivoleybol.com.tr//Sultanlar Ligi Takvimi//TR";
export const MATCH_DURATION_MINUTES = 120;
/** Türkiye kalıcı olarak UTC+3 (yaz/kış saati uygulaması yok). */
const ISTANBUL_UTC_OFFSET_HOURS = 3;

export interface SultanlarMatch {
  /** TVF maç numarası (sezon içinde sabit; UID için kullanılır). */
  matchNo: string;
  season: string;
  week: string;
  /** YYYY-MM-DD (İstanbul yerel tarihi) */
  date: string;
  /** HH:MM (İstanbul yerel saati) ya da boş */
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  city: string;
  broadcaster: string;
  homeSets: number | null;
  awaySets: number | null;
  setScores: string;
}

export interface SultanlarFeed {
  slug: string;
  calendarName: string;
  description: string;
  /** Normalize edilmiş takım adları; boş ise tüm lig. */
  teams: string[];
}

export const SULTANLAR_FEEDS: SultanlarFeed[] = [
  {
    slug: "fenerbahce-medicana",
    calendarName: "Fenerbahçe Medicana - Sultanlar Ligi 2026-27",
    description: "Vodafone Sultanlar Ligi 2026-27 Fenerbahçe Medicana maçları (kaynak: TVF).",
    teams: ["FENERBAHCE MEDICANA"],
  },
  {
    slug: "zeren-spor",
    calendarName: "Zeren Spor - Sultanlar Ligi 2026-27",
    description: "Vodafone Sultanlar Ligi 2026-27 Zeren Spor maçları (kaynak: TVF).",
    teams: ["ZEREN SPOR"],
  },
  {
    slug: "fenerbahce-medicana-zeren-spor",
    calendarName: "Fenerbahçe Medicana + Zeren Spor - Sultanlar Ligi 2026-27",
    description: "Vodafone Sultanlar Ligi 2026-27 Fenerbahçe Medicana ve Zeren Spor maçları (kaynak: TVF).",
    teams: ["FENERBAHCE MEDICANA", "ZEREN SPOR"],
  },
];

export function findFeed(slug: string): SultanlarFeed | undefined {
  return SULTANLAR_FEEDS.find((f) => f.slug === slug);
}

/** Takım adlarını karşılaştırmak için: Türkçe harfleri sadeleştir, büyük harfe çevir, boşlukları sadeleştir. */
export function normalizeTeamName(name: string): string {
  return name
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/Ç/g, "C")
    .replace(/Ğ/g, "G")
    .replace(/Ö/g, "O")
    .replace(/Ş/g, "S")
    .replace(/Ü/g, "U")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// TVF sayfasından veri çıkarma
// ---------------------------------------------------------------------------

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

type RawRow = Record<string, unknown>;

function collectRows(node: unknown, out: RawRow[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectRows(item, out);
  } else if (node && typeof node === "object") {
    const obj = node as RawRow;
    if (typeof obj.ATAKIMI === "string" && typeof obj.BTAKIMI === "string") {
      out.push(obj);
      return;
    }
    for (const value of Object.values(obj)) collectRows(value, out);
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function intOrNull(value: unknown): number | null {
  const s = str(value);
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

function toIsoDate(tarih: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(tarih.trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function toTime(saat: string): string {
  const m = /^(\d{1,2})[:.](\d{2})/.exec(saat.trim());
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

/**
 * TVF Livewire sayfasının HTML'inden `leagueFixture` maçlarını çıkarır.
 * Sayfada fikstür bulunamazsa boş dizi döner.
 */
export function parseTvfFixtureHtml(html: string): SultanlarMatch[] {
  const matches: SultanlarMatch[] = [];
  const seen = new Set<string>();
  const re = /wire:snapshot="([^"]*)"/g;
  let found: RegExpExecArray | null;
  while ((found = re.exec(html))) {
    const raw = decodeHtmlAttribute(found[1]);
    if (!raw.includes("leagueFixture")) continue;
    let snapshot: unknown;
    try {
      snapshot = JSON.parse(raw);
    } catch {
      continue;
    }
    const data = (snapshot as { data?: Record<string, unknown> }).data;
    if (!data || !("leagueFixture" in data)) continue;
    const rows: RawRow[] = [];
    collectRows(data.leagueFixture, rows);
    for (const r of rows) {
      const date = toIsoDate(str(r.TARIH));
      const matchNo = str(r.MACNO);
      if (!date || !matchNo) continue;
      const season = str(r.SEZON) || "2026-2027";
      const key = `${season}:${matchNo}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({
        matchNo,
        season,
        week: str(r.HAFTA),
        date,
        time: toTime(str(r.SAAT)),
        homeTeam: str(r.ATAKIMI),
        awayTeam: str(r.BTAKIMI),
        venue: str(r.YER),
        city: str(r.IL),
        broadcaster: str(r.TVKANAL),
        homeSets: intOrNull(r.SETA),
        awaySets: intOrNull(r.SETB),
        setScores: str(r.SETSONUCLARI).replace(/\s+/g, " "),
      });
    }
  }
  return matches.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || Number(a.matchNo) - Number(b.matchNo));
}

export function filterMatchesByTeams(matches: SultanlarMatch[], teams: string[]): SultanlarMatch[] {
  if (teams.length === 0) return matches;
  const wanted = new Set(teams.map(normalizeTeamName));
  return matches.filter((m) => wanted.has(normalizeTeamName(m.homeTeam)) || wanted.has(normalizeTeamName(m.awayTeam)));
}

// ---------------------------------------------------------------------------
// Görüntü adları (TVF verisi BÜYÜK HARF gelir)
// ---------------------------------------------------------------------------

const KEEP_UPPER = new Set(["TVF", "THY", "BBSK", "SK", "BLD", "GSK", "II", "III"]);
const WORD_OVERRIDES: Record<string, string> = {
  VAKIFBANK: "VakıfBank",
  MEDICANA: "Medicana",
};

export function displayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/[.,()]/g, "");
      if (KEEP_UPPER.has(bare)) return word;
      const override = WORD_OVERRIDES[bare];
      if (override) return word.replace(bare, override);
      if (/^\d/.test(word)) return word;
      const lower = word.toLocaleLowerCase("tr");
      return lower.charAt(0).toLocaleUpperCase("tr") + lower.slice(1);
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// iCalendar üretimi (RFC 5545)
// ---------------------------------------------------------------------------

export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** İçerik satırlarını 75 oktete katlar (UTF-8 karakterlerini bölmeden); devam satırları boşlukla başlar. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const bytes = encoder.encode(ch).length;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74; // devam satırı başındaki boşluk 1 oktet yer kaplar
    }
    current += ch;
    currentBytes += bytes;
  }
  if (current) parts.push(current);
  return parts.join("\r\n ");
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

export function formatUtc(date: Date): string {
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** İstanbul yerel tarih+saatini UTC `Date` olarak verir. */
export function istanbulToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map((n) => parseInt(n, 10));
  const [h, mi] = time.split(":").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, mo - 1, d, h - ISTANBUL_UTC_OFFSET_HOURS, mi, 0));
}

export function matchUid(match: SultanlarMatch): string {
  return `sultanlar-${match.season}-mac-${match.matchNo}@altyapivoleybol.com.tr`;
}

function buildDescription(match: SultanlarMatch): string {
  const lines: string[] = ["Vodafone Sultanlar Ligi 2026-27"];
  if (match.week) lines.push(`Hafta: ${match.week}`);
  if (match.broadcaster) lines.push(`Yayın: ${match.broadcaster}`);
  if (match.homeSets !== null && match.awaySets !== null) {
    lines.push(`Skor: ${match.homeSets}-${match.awaySets}${match.setScores ? ` ${match.setScores}` : ""}`);
  }
  lines.push("Kaynak: TVF (tvf.org.tr)");
  return lines.join("\n");
}

function buildVEvent(match: SultanlarMatch, dtstamp: string): string[] {
  const lines = ["BEGIN:VEVENT", `UID:${matchUid(match)}`, `DTSTAMP:${dtstamp}`];
  if (match.time) {
    const start = istanbulToUtc(match.date, match.time);
    const end = new Date(start.getTime() + MATCH_DURATION_MINUTES * 60_000);
    lines.push(`DTSTART:${formatUtc(start)}`, `DTEND:${formatUtc(end)}`);
  } else {
    // Saat henüz açıklanmadıysa tüm gün etkinliği
    const compact = match.date.replace(/-/g, "");
    const next = new Date(Date.UTC(+match.date.slice(0, 4), +match.date.slice(5, 7) - 1, +match.date.slice(8, 10) + 1));
    lines.push(`DTSTART;VALUE=DATE:${compact}`, `DTEND;VALUE=DATE:${formatUtc(next).slice(0, 8)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(`${displayName(match.homeTeam)} - ${displayName(match.awayTeam)}`)}`);
  const location = [displayName(match.venue), displayName(match.city)].filter(Boolean).join(", ");
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  lines.push(`DESCRIPTION:${escapeIcsText(buildDescription(match))}`);
  lines.push("STATUS:CONFIRMED", "TRANSP:TRANSPARENT");
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(matches: SultanlarMatch[], feed: Pick<SultanlarFeed, "calendarName" | "description">, now: Date = new Date()): string {
  const dtstamp = formatUtc(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${SULTANLAR_PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(feed.calendarName)}`,
    `X-WR-CALDESC:${escapeIcsText(feed.description)}`,
    "X-WR-TIMEZONE:Europe/Istanbul",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const match of matches) lines.push(...buildVEvent(match, dtstamp));
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------
// Getirme
// ---------------------------------------------------------------------------

let lastGood: { at: number; matches: SultanlarMatch[] } | null = null;

/**
 * TVF'den güncel fikstürü getirir. İstek başarısız olursa (aynı sunucu örneğinde) son başarılı sonucu döner;
 * yoksa hata fırlatır. `no-store`: Vercel Data Cache / ISR yazma kotası kullanılmaz; önbellekleme CDN başlıklarıyla yapılır.
 */
export async function fetchSultanlarMatches(fetchImpl: typeof fetch = fetch): Promise<SultanlarMatch[]> {
  try {
    const res = await fetchImpl(SULTANLAR_SOURCE_URL, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AltyapiVoleybolTakvim/1.0; +https://altyapivoleybol.com.tr)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`TVF HTTP ${res.status}`);
    const matches = parseTvfFixtureHtml(await res.text());
    if (matches.length === 0) throw new Error("TVF sayfasında Sultanlar Ligi fikstürü bulunamadı");
    lastGood = { at: Date.now(), matches };
    return matches;
  } catch (err) {
    if (lastGood) return lastGood.matches;
    throw err;
  }
}

/** Yalnızca testler için. */
export function __resetSultanlarCacheForTests(): void {
  lastGood = null;
}
