import { describe, it, expect, beforeEach } from "vitest";
import {
  buildIcs,
  displayName,
  escapeIcsText,
  fetchSultanlarMatches,
  filterMatchesByTeams,
  findFeed,
  foldLine,
  istanbulToUtc,
  matchUid,
  normalizeTeamName,
  parseTvfFixtureHtml,
  SULTANLAR_FEEDS,
  __resetSultanlarCacheForTests,
  type SultanlarMatch,
} from "../sultanlarIcs";

type Row = Record<string, string>;

function row(overrides: Row): Row {
  return {
    SEZON: "2026-2027",
    HAFTA: "1",
    TVKANAL: "TVF Voleybol TV",
    SETA: "",
    SETB: "",
    SETSONUCLARI: "    ",
    ...overrides,
  };
}

const ROWS: Row[] = [
  row({ MACNO: "3", TARIH: "04.10.2026", SAAT: "13:00", IL: "İSTANBUL", YER: "TVF BURHAN FELEK VESTEL VOLEYBOL SALONU", ATAKIMI: "FENERBAHÇE MEDICANA", BTAKIMI: "MANİSA BÜYÜKŞEHİR BELEDİYE SPOR" }),
  row({ MACNO: "6", TARIH: "04.10.2026", SAAT: "16:00", IL: "İZMİR", YER: "TVF ATATÜRK VOLEYBOL SPOR KOMPLEKSİ", ATAKIMI: "ARAS KARGO", BTAKIMI: "ZEREN SPOR" }),
  row({ MACNO: "2", TARIH: "03.10.2026", SAAT: "14:00", IL: "İSTANBUL", YER: "VAKIFBANK SPOR SARAYI", ATAKIMI: "VAKIFBANK", BTAKIMI: "BEŞİKTAŞ", SETA: "3", SETB: "1", SETSONUCLARI: "(25-16) (25-18) (23-25) (25-19) ", TVKANAL: "TRT Spor" }),
  row({ MACNO: "23", HAFTA: "4", TARIH: "18.10.2026", SAAT: "15:00", IL: "ANKARA", YER: "TVF ZİRAAT BANKKART VOLEYBOL SALONU", ATAKIMI: "ZEREN SPOR", BTAKIMI: "FENERBAHÇE MEDICANA" }),
  row({ MACNO: "99", HAFTA: "9", TARIH: "16.01.2027", SAAT: "", IL: "İSTANBUL", YER: "TVF BURHAN FELEK VESTEL VOLEYBOL SALONU", ATAKIMI: "FENERBAHÇE MEDICANA", BTAKIMI: "ZEREN SPOR" }),
];

/** TVF'nin Livewire `wire:snapshot` biçimini taklit eder: [değer, {s:'arr'}] sarmalayıcıları ve HTML nitelik kaçışı. */
function tvfHtml(rows: Row[]): string {
  const weeks: Record<string, unknown> = {};
  for (const r of rows) {
    const wk = (weeks[r.HAFTA] ??= [[], { s: "arr" }]) as [unknown[], unknown];
    wk[0].push([r, { s: "arr" }]);
  }
  const snapshot = { data: { slug: "sultanlar-ligi", leagueFixture: [weeks, { s: "arr" }] }, memo: {} };
  const attr = JSON.stringify(snapshot).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  return `<html><body><div wire:id="x" wire:snapshot="${attr}"></div></body></html>`;
}

describe("parseTvfFixtureHtml", () => {
  it("TVF snapshot'ından maçları çıkarır ve tarihe göre sıralar", () => {
    const matches = parseTvfFixtureHtml(tvfHtml(ROWS));
    expect(matches).toHaveLength(5);
    expect(matches.map((m) => m.matchNo)).toEqual(["2", "3", "6", "23", "99"]);
    const fb = matches.find((m) => m.matchNo === "3")!;
    expect(fb).toMatchObject({ date: "2026-10-04", time: "13:00", homeTeam: "FENERBAHÇE MEDICANA", city: "İSTANBUL" });
  });

  it("fikstür içermeyen sayfada boş dizi döner", () => {
    expect(parseTvfFixtureHtml("<html></html>")).toEqual([]);
    expect(parseTvfFixtureHtml('<div wire:snapshot="{bozuk json leagueFixture"></div>')).toEqual([]);
  });

  it("aynı maçı iki kez eklemez", () => {
    expect(parseTvfFixtureHtml(tvfHtml([...ROWS, ROWS[0]]))).toHaveLength(5);
  });
});

describe("takım filtreleri", () => {
  const matches = parseTvfFixtureHtml(tvfHtml(ROWS));

  it("normalizeTeamName Türkçe harfleri sadeleştirir", () => {
    expect(normalizeTeamName("Fenerbahçe  Medicana")).toBe("FENERBAHCE MEDICANA");
    expect(normalizeTeamName("İlbank")).toBe("ILBANK");
  });

  it("her takım için doğru maçları seçer, birleşik akış ikisini de içerir", () => {
    const fb = filterMatchesByTeams(matches, findFeed("fenerbahce-medicana")!.teams);
    const zs = filterMatchesByTeams(matches, findFeed("zeren-spor")!.teams);
    const both = filterMatchesByTeams(matches, findFeed("fenerbahce-medicana-zeren-spor")!.teams);
    expect(fb.map((m) => m.matchNo)).toEqual(["3", "23", "99"]);
    expect(zs.map((m) => m.matchNo)).toEqual(["6", "23", "99"]);
    expect(both.map((m) => m.matchNo)).toEqual(["3", "6", "23", "99"]);
  });

  it("üç akış tanımlıdır", () => {
    expect(SULTANLAR_FEEDS.map((f) => f.slug)).toEqual(["fenerbahce-medicana", "zeren-spor", "fenerbahce-medicana-zeren-spor"]);
    expect(findFeed("yok")).toBeUndefined();
  });
});

describe("metin yardımcıları", () => {
  it("escapeIcsText ; , \\ ve satır sonlarını kaçırır", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("foldLine 75 oktetten uzun satırları UTF-8 karakterlerini bölmeden katlar", () => {
    const line = "DESCRIPTION:" + "ğüşiöçİ".repeat(30);
    const folded = foldLine(line);
    const physical = folded.split("\r\n");
    expect(physical.length).toBeGreaterThan(1);
    const enc = new TextEncoder();
    for (const p of physical) expect(enc.encode(p).length).toBeLessThanOrEqual(75);
    for (const p of physical.slice(1)) expect(p.startsWith(" ")).toBe(true);
    expect(physical.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(line);
  });

  it("kısa satırı değiştirmez", () => {
    expect(foldLine("SUMMARY:Kısa")).toBe("SUMMARY:Kısa");
  });

  it("displayName büyük harfli TVF adlarını okunur hale getirir", () => {
    expect(displayName("FENERBAHÇE MEDICANA")).toBe("Fenerbahçe Medicana");
    expect(displayName("MANİSA BÜYÜKŞEHİR BELEDİYE SPOR")).toBe("Manisa Büyükşehir Belediye Spor");
    expect(displayName("TVF ZİRAAT BANKKART VOLEYBOL SALONU")).toBe("TVF Ziraat Bankkart Voleybol Salonu");
    expect(displayName("VAKIFBANK")).toBe("VakıfBank");
    expect(displayName("İLBANK")).toBe("İlbank");
  });
});

describe("saat dönüşümü", () => {
  it("İstanbul yerel saati UTC+3 olarak UTC'ye çevrilir", () => {
    expect(istanbulToUtc("2026-10-18", "15:00").toISOString()).toBe("2026-10-18T12:00:00.000Z");
    expect(istanbulToUtc("2027-01-16", "20:00").toISOString()).toBe("2027-01-16T17:00:00.000Z");
    // gece yarısına yakın: önceki güne taşar
    expect(istanbulToUtc("2026-10-04", "02:30").toISOString()).toBe("2026-10-03T23:30:00.000Z");
  });
});

describe("buildIcs", () => {
  const matches = parseTvfFixtureHtml(tvfHtml(ROWS));
  const feed = findFeed("fenerbahce-medicana-zeren-spor")!;
  const now = new Date("2026-10-04T09:00:00Z");
  const ics = buildIcs(filterMatchesByTeams(matches, feed.teams), feed, now);
  const unfolded = ics.replace(/\r\n /g, "");

  it("geçerli VCALENDAR başlığı ve CRLF satır sonları üretir", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(unfolded).toContain("X-WR-CALNAME:Fenerbahçe Medicana + Zeren Spor - Sultanlar Ligi 2026-27");
    expect(unfolded).toContain("X-WR-TIMEZONE:Europe/Istanbul");
    expect(unfolded).toContain("METHOD:PUBLISH");
    expect(unfolded).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
  });

  it("BEGIN/END VEVENT sayıları maç sayısıyla eşleşir", () => {
    expect((unfolded.match(/BEGIN:VEVENT/g) ?? []).length).toBe(4);
    expect((unfolded.match(/END:VEVENT/g) ?? []).length).toBe(4);
  });

  it("Zeren Spor - Fenerbahçe Medicana 18 Ekim 2026 15:00 Ankara", () => {
    const m = matches.find((x) => x.matchNo === "23")!;
    expect(unfolded).toContain(`UID:${matchUid(m)}`);
    expect(unfolded).toContain("SUMMARY:Zeren Spor - Fenerbahçe Medicana");
    expect(unfolded).toContain("DTSTART:20261018T120000Z");
    expect(unfolded).toContain("DTEND:20261018T140000Z");
    expect(unfolded).toContain("LOCATION:TVF Ziraat Bankkart Voleybol Salonu\\, Ankara");
  });

  it("Fenerbahçe Medicana - Manisa 4 Ekim 2026 13:00 ve Aras - Zeren 16:00", () => {
    expect(unfolded).toContain("SUMMARY:Fenerbahçe Medicana - Manisa Büyükşehir Belediye Spor");
    expect(unfolded).toContain("DTSTART:20261004T100000Z");
    expect(unfolded).toContain("SUMMARY:Aras Kargo - Zeren Spor");
    expect(unfolded).toContain("DTSTART:20261004T130000Z");
  });

  it("saati belli olmayan maç tüm gün etkinliği olur", () => {
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20270116");
    expect(unfolded).toContain("DTEND;VALUE=DATE:20270117");
  });

  it("UID'ler benzersiz ve çağrılar arasında kararlıdır; DTSTAMP verilen zamandır", () => {
    const uids = unfolded.match(/^UID:.*$/gm) ?? [];
    expect(new Set(uids).size).toBe(uids.length);
    const again = buildIcs(filterMatchesByTeams(matches, feed.teams), feed, new Date("2027-01-01T00:00:00Z"));
    expect(again.match(/^UID:.*$/gm)).toEqual(uids);
    expect(unfolded).toContain("DTSTAMP:20261004T090000Z");
  });

  it("oynanmış maçın skorunu açıklamaya yazar", () => {
    const played = buildIcs(matches.filter((m) => m.matchNo === "2"), feed, now).replace(/\r\n /g, "");
    expect(played).toContain("Skor: 3-1 (25-16) (25-18) (23-25) (25-19)");
    expect(played).toContain("SUMMARY:VakıfBank - Beşiktaş");
  });

  it("hiçbir fiziksel satır 75 oktetten uzun değildir", () => {
    const enc = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
  });

  it("maç yoksa yine geçerli, boş bir takvim üretir", () => {
    const empty = buildIcs([], feed, now);
    expect(empty).toContain("BEGIN:VCALENDAR");
    expect(empty).not.toContain("BEGIN:VEVENT");
  });
});

describe("fetchSultanlarMatches", () => {
  beforeEach(() => __resetSultanlarCacheForTests());

  const okFetch = (async () => new Response(tvfHtml(ROWS), { status: 200 })) as typeof fetch;
  const failFetch = (async () => new Response("hata", { status: 500 })) as typeof fetch;

  it("başarılı yanıtı ayrıştırır", async () => {
    expect(await fetchSultanlarMatches(okFetch)).toHaveLength(5);
  });

  it("TVF hata verirse ve önbellek yoksa fırlatır", async () => {
    await expect(fetchSultanlarMatches(failFetch)).rejects.toThrow(/HTTP 500/);
  });

  it("TVF hata verirse son başarılı sonucu döner", async () => {
    await fetchSultanlarMatches(okFetch);
    const stale: SultanlarMatch[] = await fetchSultanlarMatches(failFetch);
    expect(stale).toHaveLength(5);
  });

  it("fikstürsüz sayfa hata sayılır", async () => {
    const empty = (async () => new Response("<html></html>", { status: 200 })) as typeof fetch;
    await expect(fetchSultanlarMatches(empty)).rejects.toThrow();
  });
});
