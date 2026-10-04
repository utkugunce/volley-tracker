import { describe, it, expect } from "vitest";
import { toCalendarMatch } from "../takvimData";
import type { SultanlarMatch } from "../sultanlarIcs";

describe("toCalendarMatch", () => {
  it("TVF kaydını görüntü adlarıyla serileştirilebilir takvim kaydına çevirir", () => {
    const m: SultanlarMatch = {
      matchNo: "6",
      season: "2026-2027",
      week: "1",
      date: "2026-10-04",
      time: "16:00",
      homeTeam: "ARAS KARGO",
      awayTeam: "ZEREN SPOR",
      venue: "TVF ATATÜRK VOLEYBOL SPOR KOMPLEKSİ",
      city: "İZMİR",
      broadcaster: "TVF Voleybol TV",
      homeSets: 3,
      awaySets: 1,
      setScores: "(25-16) (25-18)",
    };
    expect(toCalendarMatch(m)).toEqual({
      id: "2026-2027-6",
      date: "2026-10-04",
      time: "16:00",
      week: "1",
      home: "Aras Kargo",
      away: "Zeren Spor",
      venue: "TVF Atatürk Voleybol Spor Kompleksi",
      city: "İzmir",
      broadcaster: "TVF Voleybol TV",
      homeSets: 3,
      awaySets: 1,
      setScores: "(25-16) (25-18)",
    });
    expect(() => JSON.stringify(toCalendarMatch(m))).not.toThrow();
  });
});
