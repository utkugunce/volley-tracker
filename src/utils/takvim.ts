/**
 * /takvim sayfası için saf (bağımlılıksız) tarih ve takvim ızgarası yardımcıları.
 * Tüm tarihler "YYYY-MM-DD" (İstanbul yerel tarihi) biçimindedir; Date nesneleri yalnızca UTC üzerinden
 * hesaplanır, böylece tarayıcının saat dilimi sonucu etkilemez.
 */

export const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** Pazartesi başlangıçlı hafta. */
export const TR_WEEKDAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
export const TR_WEEKDAYS_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;

/** Sunucudan istemciye giden, serileştirilebilir maç kaydı (görüntü adları hazır). */
export interface CalendarMatch {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM ya da boş (saat henüz açıklanmadı) */
  time: string;
  week: string;
  home: string;
  away: string;
  venue: string;
  city: string;
  broadcaster: string;
  homeSets: number | null;
  awaySets: number | null;
  setScores: string;
}

export interface GridDay {
  date: string;
  inMonth: boolean;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

/** Geçerli bir takvim gününü ayrıştırır; geçersizse (ör. 2026-02-30) null döner. */
export function parseDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const m = DATE_RE.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidDate(value: string | null | undefined): value is string {
  return parseDate(value) !== null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Haftanın günü; Pazartesi = 0 ... Pazar = 6. */
export function weekdayIndex(date: string): number {
  const p = parseDate(date);
  if (!p) return 0;
  const js = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); // 0 = Pazar
  return (js + 6) % 7;
}

/** Verilen anın İstanbul'daki tarihi (YYYY-MM-DD). */
export function istanbulToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "YYYY-MM" ay anahtarı. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), month };
}

export function shiftMonth(key: string, delta: number): string {
  const p = parseMonthKey(key);
  if (!p) return key;
  const total = p.year * 12 + (p.month - 1) + delta;
  const year = Math.floor(total / 12);
  const month = (total % 12 + 12) % 12 + 1;
  return `${String(year).padStart(4, "0")}-${pad(month)}`;
}

export function monthLabel(key: string): string {
  const p = parseMonthKey(key);
  if (!p) return key;
  return `${TR_MONTHS[p.month - 1]} ${p.year}`;
}

/** "4 Ekim 2026 Pazar" biçiminde uzun Türkçe tarih. */
export function longDateLabel(date: string): string {
  const p = parseDate(date);
  if (!p) return date;
  return `${p.day} ${TR_MONTHS[p.month - 1]} ${p.year} ${TR_WEEKDAYS_LONG[weekdayIndex(date)]}`;
}

/**
 * Ayın ızgarası (Pazartesi başlangıçlı). Önceki/sonraki aya taşan günler `inMonth: false` olur.
 * Satır sayısı ayın ihtiyacına göre 4–6 arasındadır; uzunluk her zaman 7'nin katıdır.
 */
export function buildMonthGrid(key: string): GridDay[] {
  const p = parseMonthKey(key);
  if (!p) return [];
  const first = formatDate(p.year, p.month, 1);
  const lead = weekdayIndex(first);
  const total = daysInMonth(p.year, p.month);
  const cells = Math.ceil((lead + total) / 7) * 7;
  const days: GridDay[] = [];
  for (let i = 0; i < cells; i++) {
    const d = new Date(Date.UTC(p.year, p.month - 1, 1 - lead + i));
    const date = formatDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    days.push({ date, inMonth: d.getUTCMonth() === p.month - 1 });
  }
  return days;
}

export function groupMatchesByDate(matches: CalendarMatch[]): Record<string, CalendarMatch[]> {
  const out: Record<string, CalendarMatch[]> = {};
  for (const m of matches) {
    (out[m.date] ??= []).push(m);
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.id.localeCompare(b.id, "tr", { numeric: true }));
  }
  return out;
}

/**
 * Varsayılan seçili gün: bugün maç varsa bugün, yoksa bugünden sonraki ilk maç günü.
 * Bugünden sonra maç yoksa en son maç günü, hiç maç yoksa bugün.
 */
export function pickDefaultDate(byDate: Record<string, unknown[]>, today: string): string {
  const dates = Object.keys(byDate)
    .filter((d) => (byDate[d]?.length ?? 0) > 0)
    .sort();
  if (dates.length === 0) return today;
  if (dates.includes(today)) return today;
  const next = dates.find((d) => d > today);
  return next ?? dates[dates.length - 1];
}

export function isPlayed(match: Pick<CalendarMatch, "homeSets" | "awaySets">): boolean {
  return match.homeSets !== null && match.awaySets !== null;
}

export const GUN_PARAM = "gun";
