import { describe, it, expect } from "vitest";
import { formatGroupName, formatLeagueCategoryTitle, groupResultsByCityAndLeague } from "../grouping";
import { Match } from "@/types/fixture";

describe("Grouping & Group Name Formatting Utilities", () => {
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
    it("groups matches under their respective city and unifies same leagues with multiple groups (e.g. İzmir U18 A and D groups)", () => {
      const sampleMatches: Match[] = [
        {
          id: "m-izmir-1",
          city: "İzmir",
          date: "2026-09-19",
          time: "14:00",
          hall: "Halkapınar",
          category: "Genç Kızlar Süper Lig",
          age_group: "Genç",
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

      const izmir = grouped.find((c) => c.city === "İzmir");
      expect(izmir).toBeDefined();
      expect(izmir?.totalMatches).toBe(4);
      // Under İzmir, exactly 2 leagues: U18 (Genç Kızlar) and U16 (Yıldız Kızlar)
      expect(izmir?.leagues).toHaveLength(2);

      const gencLig = izmir?.leagues.find((l) => l.rawCategory === "Genç Kızlar Süper Lig");
      expect(gencLig).toBeDefined();
      expect(gencLig?.title).toBe("Genç Kızlar Süper Lig (U18)");
      expect(gencLig?.subTitle).toBe("A Grubu • D Grubu");
      expect(gencLig?.matches).toHaveLength(2);

      const yildizLig = izmir?.leagues.find((l) => l.rawCategory === "Yıldız Kızlar Süper Lig");
      expect(yildizLig).toBeDefined();
      expect(yildizLig?.title).toBe("Yıldız Kızlar Süper Lig (U16)");
      expect(yildizLig?.subTitle).toBe("A Grubu • C Grubu");
      expect(yildizLig?.matches).toHaveLength(2);
    });
  });
});
