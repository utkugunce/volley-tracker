import { describe, it, expect } from "vitest";
import { formatGroupName, formatLeagueCategoryTitle, groupResultsByCityAndLeague, getLeagueDisplayTitle } from "../grouping";
import { Match } from "@/types/fixture";

describe("Grouping & Group Name Formatting Utilities", () => {
  describe("getLeagueDisplayTitle", () => {
    it("cleans redundant season strings from league title (e.g. Aydın)", () => {
      expect(
        getLeagueDisplayTitle("Genç Kızlar 1. Ligi", "2026 - 2027 Voleybol Sezonu Genç Kızlar Ligi")
      ).toBe("Genç Kızlar 1. Ligi");
    });

    it("cleans repeated category names (e.g. Yalova / Bilecik)", () => {
      expect(
        getLeagueDisplayTitle("Genç Kızlar Süper Lig", "Genç Kızlar Süper Ligi")
      ).toBe("Genç Kızlar Süper Lig");
    });

    it("preserves legitimate group subtitles", () => {
      expect(
        getLeagueDisplayTitle("Genç Kızlar Süper Lig", "A Grubu")
      ).toBe("Genç Kızlar Süper Lig · A Grubu");

      expect(
        getLeagueDisplayTitle("Genç Kızlar 1. Ligi", "1. Grup")
      ).toBe("Genç Kızlar 1. Ligi · 1. Grup");
    });

    it("handles missing subtitle gracefully", () => {
      expect(getLeagueDisplayTitle("Genç Kızlar Süper Lig", "")).toBe("Genç Kızlar Süper Lig");
      expect(getLeagueDisplayTitle("Genç Kızlar Süper Lig", undefined)).toBe("Genç Kızlar Süper Lig");
    });
  });

  describe("formatGroupName", () => {
    it("cleans and normalizes dash-separated group abbreviations", () => {
      expect(formatGroupName("Genç Kız - A Gr")).toBe("A Grubu");
      expect(formatGroupName("Genç Kız - D Gr")).toBe("D Grubu");
      expect(formatGroupName("Yıldız Kızlar - A Gr")).toBe("A Grubu");
      expect(formatGroupName("Yıldız Kızlar - C Gr")).toBe("C Grubu");
    });

    it("cleans league prefix from full group names", () => {
      expect(formatGroupName("Yıldız Kızlar B Grubu")).toBe("B Grubu");
      expect(formatGroupName("Yıldız Kızlar Doğu Grubu")).toBe("Doğu Grubu");
      expect(formatGroupName("Genç Kızlar A Grubu")).toBe("A Grubu");
    });

    it("handles typos, abbreviations, and numeric groups", () => {
      expect(formatGroupName("A Grb.")).toBe("A Grubu");
      expect(formatGroupName("A Gurubu")).toBe("A Grubu");
      expect(formatGroupName("Grup A")).toBe("A Grubu");
      expect(formatGroupName("1. Grup")).toBe("1. Grup");
      expect(formatGroupName("2.Grup")).toBe("2. Grup");
      expect(formatGroupName("4. Grup")).toBe("4. Grup");
    });

    it("preserves already clean group names", () => {
      expect(formatGroupName("A Grubu")).toBe("A Grubu");
      expect(formatGroupName("Final Grubu")).toBe("Final Grubu");
      expect(formatGroupName("Tek Grup")).toBe("Tek Grup");
      expect(formatGroupName("")).toBe("Tek Grup");
    });
  });

  describe("formatLeagueCategoryTitle", () => {
    it("adds age group code (U18, U16, U14) to league titles", () => {
      expect(formatLeagueCategoryTitle("Genç Kızlar Süper Lig")).toBe("Genç Kızlar Süper Lig (U18)");
      expect(formatLeagueCategoryTitle("Yıldız Kızlar Süper Lig")).toBe("Yıldız Kızlar Süper Lig (U16)");
      expect(formatLeagueCategoryTitle("Küçük Kızlar")).toBe("Küçük Kızlar (U14)");
    });

    it("does not duplicate age group code if already present", () => {
      expect(formatLeagueCategoryTitle("Voleybol U18 Ligi")).toBe("Voleybol U18 Ligi");
      expect(formatLeagueCategoryTitle("U16 Gelişim Ligi")).toBe("U16 Gelişim Ligi");
    });
  });

  describe("groupResultsByCityAndLeague", () => {
    it("groups matches under their respective city and splits every group (A Grubu, B Grubu etc.) into its own section", () => {
      const sampleMatches: Match[] = [
        {
          id: "m-izmir-1",
          city: "İzmir",
          date: "2026-09-19",
          time: "14:00",
          hall: "Halkapınar",
          category: "Genç Kızlar Süper Lig",
          age_group: "Genç",
          gender: "Kız",
          match_no: "1",
          group: "Genç Kız - A Gr",
          home_team: "Göztepe SK - A U18",
          away_team: "Volkan Güç Spor Kulübü - B U18",
          score: "3 - 0",
          status: "finished",
        },
        {
          id: "m-izmir-2",
          city: "İzmir",
          date: "2026-09-19",
          time: "16:30",
          hall: "Menemen",
          category: "Genç Kızlar Süper Lig",
          age_group: "Genç",
          gender: "Kız",
          match_no: "2",
          group: "Genç Kız - D Gr",
          home_team: "Mavişehir Spor Kulübü U18",
          away_team: "Dost Spor U18",
          score: "3 - 0",
          status: "finished",
        },
        {
          id: "m-izmir-3",
          city: "İzmir",
          date: "2026-09-19",
          time: "11:00",
          hall: "Gaziemir",
          category: "Yıldız Kızlar Süper Lig",
          age_group: "Yıldız",
          gender: "Kız",
          match_no: "3",
          group: "Yıldız Kızlar - A Gr",
          home_team: "AB Voleybol Akademi U16",
          away_team: "Vakıfbank İzmir U16",
          score: "3 - 0",
          status: "finished",
        },
        {
          id: "m-izmir-4",
          city: "İzmir",
          date: "2026-09-19",
          time: "13:00",
          hall: "Gaziemir",
          category: "Yıldız Kızlar Süper Lig",
          age_group: "Yıldız",
          gender: "Kız",
          match_no: "4",
          group: "Yıldız Kızlar - C Gr",
          home_team: "Parla Voleybol Kulübü - B U16",
          away_team: "Göksu Atletik Spor Kulübü U16",
          score: "3 - 0",
          status: "finished",
        },
        {
          id: "m-antalya-1",
          city: "Antalya",
          date: "2026-09-19",
          time: "15:00",
          hall: "Antalya Spor Salonu",
          category: "Yıldız Kızlar Süper Lig",
          age_group: "Yıldız",
          gender: "Kız",
          match_no: "5",
          group: "Yıldız Kızlar B Grubu",
          home_team: "Antalya DSİ Spor Kulübü U16",
          away_team: "07 Zenit Spor Kulübü U16",
          score: "3 - 1",
          status: "finished",
        },
      ];

      const grouped = groupResultsByCityAndLeague(sampleMatches);

      // Should produce 2 cities: Antalya and İzmir
      expect(grouped).toHaveLength(2);

      const antalya = grouped.find((c) => c.city === "Antalya");
      expect(antalya).toBeDefined();
      expect(antalya?.totalMatches).toBe(1);
      expect(antalya?.leagues).toHaveLength(1);
      expect(antalya?.leagues[0].title).toBe("Yıldız Kızlar Süper Lig (U16)");
      expect(antalya?.leagues[0].subTitle).toBe("B Grubu");
      expect(getLeagueDisplayTitle(antalya!.leagues[0].title, antalya!.leagues[0].subTitle)).toBe(
        "Yıldız Kızlar Süper Lig (U16) · B Grubu"
      );

      const izmir = grouped.find((c) => c.city === "İzmir");
      expect(izmir).toBeDefined();
      expect(izmir?.totalMatches).toBe(4);
      // Under İzmir, each group is its own section: 4 separate sections!
      expect(izmir?.leagues).toHaveLength(4);

      const gencA = izmir?.leagues.find((l) => l.rawCategory === "Genç Kızlar Süper Lig" && l.subTitle === "A Grubu");
      expect(gencA).toBeDefined();
      expect(gencA?.title).toBe("Genç Kızlar Süper Lig (U18)");
      expect(gencA?.matches).toHaveLength(1);

      const gencD = izmir?.leagues.find((l) => l.rawCategory === "Genç Kızlar Süper Lig" && l.subTitle === "D Grubu");
      expect(gencD).toBeDefined();
      expect(gencD?.title).toBe("Genç Kızlar Süper Lig (U18)");
      expect(gencD?.matches).toHaveLength(1);

      const yildizA = izmir?.leagues.find((l) => l.rawCategory === "Yıldız Kızlar Süper Lig" && l.subTitle === "A Grubu");
      expect(yildizA).toBeDefined();
      expect(yildizA?.title).toBe("Yıldız Kızlar Süper Lig (U16)");
      expect(yildizA?.matches).toHaveLength(1);

      const yildizC = izmir?.leagues.find((l) => l.rawCategory === "Yıldız Kızlar Süper Lig" && l.subTitle === "C Grubu");
      expect(yildizC).toBeDefined();
      expect(yildizC?.title).toBe("Yıldız Kızlar Süper Lig (U16)");
      expect(yildizC?.matches).toHaveLength(1);
    });

    it("separates leagues with regional subdivisions and groups into distinct sections (e.g. Istanbul 1. Bölge A/B vs 4. Bölge B)", () => {
      const istanbulMatches: Match[] = [
        {
          id: "m-ist-1",
          city: "İstanbul",
          date: "2026-09-27",
          time: "19:30",
          hall: "Çengelköy",
          category: "Genç Kızlar 1. Ligi",
          age_group: "Genç",
          gender: "Kız",
          match_no: "1",
          group: "1. Bölge A Grubu",
          home_team: "Çengelköy Voleybol Kulübü U18",
          away_team: "İstanbul Anka Spor U18",
          score: "3 - 0",
          status: "finished",
        },
        {
          id: "m-ist-2",
          city: "İstanbul",
          date: "2026-09-27",
          time: "18:00",
          hall: "Bahçeşehir",
          category: "Genç Kızlar 1. Ligi",
          age_group: "Genç",
          gender: "Kız",
          match_no: "2",
          group: "4. Bölge B Grubu",
          home_team: "Bahçeşehir Avrupa Gelişim Spor Kulübü U18",
          away_team: "Başakşehir Voleybol Kulübü U18",
          score: "1 - 3",
          status: "finished",
        },
        {
          id: "m-ist-3",
          city: "İstanbul",
          date: "2026-09-27",
          time: "16:00",
          hall: "Çengelköy",
          category: "Genç Kızlar 1. Ligi",
          age_group: "Genç",
          gender: "Kız",
          match_no: "3",
          group: "1. Bölge B Grubu",
          home_team: "Beylerbeyi Voleybol Kulübü U18",
          away_team: "Kuzey Marmara Spor U18",
          score: "3 - 2",
          status: "finished",
        },
      ];

      const grouped = groupResultsByCityAndLeague(istanbulMatches);
      expect(grouped).toHaveLength(1);
      const istanbul = grouped[0];
      expect(istanbul.city).toBe("İstanbul");
      // Must separate 1. Bölge A, 1. Bölge B and 4. Bölge B into 3 distinct sections!
      expect(istanbul.leagues).toHaveLength(3);

      const b1a = istanbul.leagues.find((l) => l.categoryKey.includes("1. Bölge") && l.subTitle === "A Grubu");
      expect(b1a).toBeDefined();
      expect(b1a?.title).toContain("1. Bölge");
      expect(b1a?.subTitle).toBe("A Grubu");
      expect(b1a?.matches).toHaveLength(1);

      const b1b = istanbul.leagues.find((l) => l.categoryKey.includes("1. Bölge") && l.subTitle === "B Grubu");
      expect(b1b).toBeDefined();
      expect(b1b?.title).toContain("1. Bölge");
      expect(b1b?.subTitle).toBe("B Grubu");
      expect(b1b?.matches).toHaveLength(1);

      const b4b = istanbul.leagues.find((l) => l.categoryKey.includes("4. Bölge") && l.subTitle === "B Grubu");
      expect(b4b).toBeDefined();
      expect(b4b?.title).toContain("4. Bölge");
      expect(b4b?.subTitle).toBe("B Grubu");
      expect(b4b?.matches).toHaveLength(1);
    });
  });
});
