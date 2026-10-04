import { describe, it, expect } from "vitest";
import {
  buildMonthGrid,
  daysInMonth,
  groupMatchesByDate,
  isPlayed,
  isValidDate,
  istanbulToday,
  longDateLabel,
  monthKey,
  monthLabel,
  parseDate,
  pickDefaultDate,
  shiftMonth,
  weekdayIndex,
  type CalendarMatch,
} from "../takvim";

function match(id: string, date: string, time: string, extra: Partial<CalendarMatch> = {}): CalendarMatch {
  return {
    id,
    date,
    time,
    week: "1",
    home: "A",
    away: "B",
    venue: "",
    city: "",
    broadcaster: "",
    homeSets: null,
    awaySets: null,
    setScores: "",
    ...extra,
  };
}

describe("tarih doğrulama", () => {
  it("geçerli ve geçersiz günleri ayırt eder", () => {
    expect(parseDate("2026-10-04")).toEqual({ year: 2026, month: 10, day: 4 });
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-10-4")).toBe(false);
    expect(isValidDate("bugun")).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it("ay uzunluklarını (artık yıl dahil) hesaplar", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 10)).toBe(31);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it("haftanın gününü Pazartesi = 0 olarak verir", () => {
    expect(weekdayIndex("2026-10-04")).toBe(6); // Pazar
    expect(weekdayIndex("2026-10-05")).toBe(0); // Pazartesi
    expect(weekdayIndex("2026-10-01")).toBe(3); // Perşembe
  });

  it("uzun tarih etiketini Türkçe üretir", () => {
    expect(longDateLabel("2026-10-18")).toBe("18 Ekim 2026 Pazar");
    expect(longDateLabel("2027-01-16")).toBe("16 Ocak 2027 Cumartesi");
  });
});

describe("istanbulToday", () => {
  it("UTC gece yarısına yakın anlarda İstanbul tarihini (UTC+3) verir", () => {
    expect(istanbulToday(new Date("2026-10-04T20:59:59Z"))).toBe("2026-10-04");
    expect(istanbulToday(new Date("2026-10-04T21:00:00Z"))).toBe("2026-10-05");
    expect(istanbulToday(new Date("2026-12-31T22:30:00Z"))).toBe("2027-01-01");
  });
});

describe("ay gezintisi", () => {
  it("ay kaydırma yıl sınırını aşar", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-03", -15)).toBe("2024-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });

  it("ay anahtarı ve etiketi", () => {
    expect(monthKey("2026-10-04")).toBe("2026-10");
    expect(monthLabel("2026-10")).toBe("Ekim 2026");
    expect(monthLabel("2027-01")).toBe("Ocak 2027");
  });
});

describe("buildMonthGrid", () => {
  it("Ekim 2026: Perşembe başlar, 5 satır, önceki/sonraki ay günleriyle tamamlanır", () => {
    const grid = buildMonthGrid("2026-10");
    expect(grid).toHaveLength(35);
    expect(grid[0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(grid[3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid[33]).toEqual({ date: "2026-10-31", inMonth: true });
    expect(grid[34]).toEqual({ date: "2026-11-01", inMonth: false });
    expect(grid.filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("ayın 1'i Pazartesi ise önceki aydan gün taşmaz (Haziran 2026)", () => {
    const grid = buildMonthGrid("2026-06");
    expect(grid[0]).toEqual({ date: "2026-06-01", inMonth: true });
    expect(grid).toHaveLength(35);
  });

  it("4 haftalık (Şubat 2027, Pazartesi başlar, 28 gün) ve 6 haftalık aylar", () => {
    expect(buildMonthGrid("2027-02")).toHaveLength(28);
    // Mayıs 2027: 1'i Cumartesi, 31 gün → 6 satır
    expect(buildMonthGrid("2027-05")).toHaveLength(42);
  });

  it("her zaman 7'nin katı, ardışık günler ve Pazartesi başlangıçlı", () => {
    for (const key of ["2026-10", "2027-01", "2027-02", "2028-02", "2026-12"]) {
      const grid = buildMonthGrid(key);
      expect(grid.length % 7).toBe(0);
      expect(weekdayIndex(grid[0].date)).toBe(0);
      for (let i = 1; i < grid.length; i++) {
        const prev = new Date(grid[i - 1].date + "T00:00:00Z").getTime();
        const cur = new Date(grid[i].date + "T00:00:00Z").getTime();
        expect(cur - prev).toBe(86_400_000);
      }
    }
  });

  it("geçersiz anahtarda boş döner", () => {
    expect(buildMonthGrid("2026-13")).toEqual([]);
    expect(buildMonthGrid("x")).toEqual([]);
  });
});

describe("groupMatchesByDate / pickDefaultDate", () => {
  const matches = [
    match("2", "2026-10-04", "16:00"),
    match("1", "2026-10-04", "13:00"),
    match("3", "2026-10-18", "15:00"),
    match("4", "2026-10-11", ""),
  ];
  const byDate = groupMatchesByDate(matches);

  it("günlere böler ve saate göre sıralar (saatsiz maç sona)", () => {
    expect(Object.keys(byDate).sort()).toEqual(["2026-10-04", "2026-10-11", "2026-10-18"]);
    expect(byDate["2026-10-04"].map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("bugün maç varsa bugünü seçer", () => {
    expect(pickDefaultDate(byDate, "2026-10-04")).toBe("2026-10-04");
  });

  it("bugün maç yoksa bugünden sonraki ilk maç gününü seçer", () => {
    expect(pickDefaultDate(byDate, "2026-10-05")).toBe("2026-10-11");
    expect(pickDefaultDate(byDate, "2026-09-01")).toBe("2026-10-04");
  });

  it("gelecekte maç kalmadıysa son maç gününü, hiç maç yoksa bugünü seçer", () => {
    expect(pickDefaultDate(byDate, "2026-12-01")).toBe("2026-10-18");
    expect(pickDefaultDate({}, "2026-12-01")).toBe("2026-12-01");
  });
});

describe("isPlayed", () => {
  it("iki takımın set sayısı da varsa oynanmıştır", () => {
    expect(isPlayed({ homeSets: 3, awaySets: 0 })).toBe(true);
    expect(isPlayed({ homeSets: 0, awaySets: 3 })).toBe(true);
    expect(isPlayed({ homeSets: null, awaySets: null })).toBe(false);
    expect(isPlayed({ homeSets: 3, awaySets: null })).toBe(false);
  });
});
