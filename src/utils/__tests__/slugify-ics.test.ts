import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";
import { generateMatchIcs, generateSeasonIcs } from "../ics";
import { Match } from "@/types/fixture";

describe("slugify utility", () => {
  it("correctly converts Turkish characters and punctuation to clean slugs", () => {
    expect(slugify("Fenerbahçe")).toBe("fenerbahce");
    expect(slugify("Eczacıbaşı")).toBe("eczacibasi");
    expect(slugify("VakıfBank")).toBe("vakifbank");
    expect(slugify("Genia İz Akademi")).toBe("genia-iz-akademi");
    expect(slugify("Ufuk Üniversitesi Üç Pas")).toBe("ufuk-universitesi-uc-pas");
    expect(slugify("TED Ankara Kolejliler (A)")).toBe("ted-ankara-kolejliler-a");
    expect(slugify("  Çaba Spor Kulübü  ")).toBe("caba-spor-kulubu");
    expect(slugify("")).toBe("");
  });
});

describe("ics utility", () => {
  const mockMatch: Match = {
    id: "m-test-1",
    city: "İstanbul",
    date: "2026-10-15",
    time: "17:30",
    hall: "Burhan Felek Voleybol Salonu",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "1. Grup",
    match_no: "101",
    home_team: "Fenerbahçe",
    away_team: "Eczacıbaşı",
    score: "- : -",
    status: "upcoming",
  };

  it("generates a valid single match .ics", () => {
    const ics = generateMatchIcs(mockMatch);
    expect(ics).not.toBeNull();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261015T173000");
    expect(ics).toContain("DTEND:20261015T193000");
    expect(ics).toContain("SUMMARY:Fenerbahçe - Eczacıbaşı");
    expect(ics).toContain("LOCATION:Burhan Felek Voleybol Salonu\\, İstanbul");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("returns null for invalid or TBD dates", () => {
    const tbdMatch: Match = { ...mockMatch, date: "TBD" };
    expect(generateMatchIcs(tbdMatch)).toBeNull();
  });

  it("generates a valid multi-match season .ics", () => {
    const ics = generateSeasonIcs([mockMatch], "Fenerbahçe Sezon Takvimi");
    expect(ics).toContain("X-WR-CALNAME:Fenerbahçe Sezon Takvimi");
    expect(ics).toContain("SUMMARY:Fenerbahçe - Eczacıbaşı");
  });
});
