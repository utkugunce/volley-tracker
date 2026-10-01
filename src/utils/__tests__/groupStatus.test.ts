import { describe, it, expect } from "vitest";
import {
  GROUP_STATUS_CONFIGS,
  GROUP_STATUS_LIST,
  evaluateGroupStatus,
  computeGroupStatusList,
} from "@/utils/groupStatus";
import { getAppRoute, parseAppRoute } from "@/components/DashboardClient";
import { Match } from "@/types/fixture";

describe("groupStatus", () => {
  it("defines exactly the 7 visual statuses from the user specification", () => {
    expect(GROUP_STATUS_LIST).toHaveLength(7);

    expect(GROUP_STATUS_CONFIGS.all_dated_entered).toEqual(
      expect.objectContaining({
        label: "Tarihi belli tüm maçlar girildi",
        hex: "#9BE15D",
        officialHex: "#00b050",
      })
    );

    expect(GROUP_STATUS_CONFIGS.partial).toEqual(
      expect.objectContaining({
        label: "Kısmen girildi",
        hex: "#FFC24D",
        officialHex: "#ffff00",
      })
    );

    expect(GROUP_STATUS_CONFIGS.not_entered).toEqual(
      expect.objectContaining({
        label: "Maçlar girilmedi",
        hex: "#FF6E82",
        officialHex: "#ff0000",
      })
    );

    expect(GROUP_STATUS_CONFIGS.no_matches).toEqual(
      expect.objectContaining({
        label: "Maç Yok",
        hex: "#8CA8B8",
        officialHex: "#404040",
      })
    );

    expect(GROUP_STATUS_CONFIGS.teams_only).toEqual(
      expect.objectContaining({
        label: "Takımlar belli fikstür yok",
        hex: "#E8743B",
        officialHex: "#f79646",
      })
    );

    expect(GROUP_STATUS_CONFIGS.all_program_entered).toEqual(
      expect.objectContaining({
        label: "Programdaki tüm maçlar girildi",
        hex: "#5B9DFF",
        officialHex: "#1f497d",
      })
    );

    expect(GROUP_STATUS_CONFIGS.finished).toEqual(
      expect.objectContaining({
        label: "Lig Bitti",
        hex: "#B79BFF",
        officialHex: "#7030a0",
      })
    );
  });

  describe("Fileönü tema kontrastı ve ayırt edilebilirlik", () => {
    const lin = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    };
    const cr = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const SURFACE = "#0E2033";
    const CANVAS = "#07131F";

    it.each(GROUP_STATUS_LIST.map((c) => [c.key, c] as const))(
      "%s: etiket metni rozet zeminine karşı WCAG AA (≥ 4.5)",
      (_k, c) => {
        expect(cr(c.textColor, c.hex)).toBeGreaterThanOrEqual(4.5);
      }
    );

    it.each(GROUP_STATUS_LIST.map((c) => [c.key, c] as const))(
      "%s: durum rengi (nokta/rozet) panel zeminine karşı ≥ 4.5 (metin dışı için ≥ 3 yeterli)",
      (_k, c) => {
        expect(cr(c.hex, SURFACE)).toBeGreaterThanOrEqual(4.5);
        expect(cr(c.hex, CANVAS)).toBeGreaterThanOrEqual(4.5);
      }
    );

    it("7 durum rengi birbirinden farklıdır ve ton ailesi resmî renkle aynı kalır (≤ 60° kayma)", () => {
      const hexes = GROUP_STATUS_LIST.map((c) => c.hex.toLowerCase());
      expect(new Set(hexes).size).toBe(7);
      const hue = (hex: string) => {
        const n = parseInt(hex.slice(1), 16);
        const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d === 0) return -1;
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
        return h < 0 ? h + 360 : h;
      };
      const diff = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      for (const c of GROUP_STATUS_LIST) {
        if (c.key === "no_matches") continue; // nötr gri
        expect(diff(hue(c.hex), hue(c.officialHex))).toBeLessThanOrEqual(60);
      }
    });

    it("her çift arasında yeterli parlaklık VEYA ton farkı vardır (yalnız renge dayanmaz: etiket metni de gösterilir)", () => {
      const list = GROUP_STATUS_LIST;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i].hex, b = list[j].hex;
          const lr = cr(a, b);
          const dr = Math.abs(((parseInt(a.slice(1), 16) >> 16) & 255) - ((parseInt(b.slice(1), 16) >> 16) & 255));
          const dg = Math.abs(((parseInt(a.slice(1), 16) >> 8) & 255) - ((parseInt(b.slice(1), 16) >> 8) & 255));
          const db = Math.abs((parseInt(a.slice(1), 16) & 255) - (parseInt(b.slice(1), 16) & 255));
          // Öklid RGB uzaklığı (kaba eşik)
          expect(Math.sqrt(dr * dr + dg * dg + db * db) + lr * 10).toBeGreaterThan(60);
        }
      }
    });
  });

  describe("evaluateGroupStatus", () => {
    it("returns 'finished' ONLY when all matches are finished AND all matches are synced to Volleybox", () => {
      expect(
        evaluateGroupStatus({
          total: 10,
          dated: 10,
          synced: 10,
          finished: 10,
          teamsCount: 5,
        })
      ).toBe("finished");
    });

    it("does NOT return 'finished' if matches are finished on TVF but not yet entered into Volleybox", () => {
      // Tüm maçlar TVF sitesinde bitmiş ama Volleybox'a hiç girilmemiş -> not_entered
      expect(
        evaluateGroupStatus({
          total: 10,
          dated: 10,
          synced: 0,
          finished: 10,
          teamsCount: 5,
        })
      ).toBe("not_entered");

      // Tüm maçlar TVF sitesinde bitmiş ama Volleybox'a kısmen girilmiş -> partial
      expect(
        evaluateGroupStatus({
          total: 10,
          dated: 10,
          synced: 6,
          finished: 10,
          teamsCount: 5,
        })
      ).toBe("partial");
    });

    it("returns 'all_program_entered' when all matches in the program are synced but league is not finished", () => {
      expect(
        evaluateGroupStatus({
          total: 12,
          dated: 12,
          synced: 12,
          finished: 3,
          teamsCount: 6,
        })
      ).toBe("all_program_entered");
    });

    it("returns 'all_dated_entered' when all dated matches are synced but some dates are TBD", () => {
      expect(
        evaluateGroupStatus({
          total: 12,
          dated: 8,
          synced: 8,
          finished: 2,
          teamsCount: 6,
        })
      ).toBe("all_dated_entered");
    });

    it("returns 'partial' when some matches are synced but less than dated", () => {
      expect(
        evaluateGroupStatus({
          total: 10,
          dated: 10,
          synced: 4,
          finished: 0,
          teamsCount: 5,
        })
      ).toBe("partial");
    });

    it("returns 'not_entered' when matches exist but 0 are synced", () => {
      expect(
        evaluateGroupStatus({
          total: 8,
          dated: 8,
          synced: 0,
          finished: 0,
          teamsCount: 4,
        })
      ).toBe("not_entered");
    });

    it("does not classify a group as not entered when it contains a recorded forfeit", () => {
      const list = computeGroupStatusList([
        {
          id: "forfeit",
          city: "Çanakkale",
          date: "2026-09-28",
          time: "20:00",
          hall: "18 Mart Ss.",
          category: "Yıldız Kızlar Süper Lig",
          age_group: "Yıldız",
          gender: "Kız",
          group: "Yıldız Kız İl Birinciliği B Grubu",
          match_no: "2",
          home_team: "(H) - Uvm Akademi Spor Kulübü",
          away_team: "Çanakkale Belediyespor",
          score: "0 - 3",
          home_score: 0,
          away_score: 3,
          set_scores: ["0-25", "0-25", "0-25"],
          status: "finished",
        },
        {
          id: "upcoming",
          city: "Çanakkale",
          date: "2026-10-04",
          time: "14:00",
          hall: "Bayramiç Ss.",
          category: "Yıldız Kızlar Süper Lig",
          age_group: "Yıldız",
          gender: "Kız",
          group: "Yıldız Kız İl Birinciliği B Grubu",
          match_no: "4",
          home_team: "Yeşil Bayramiç Spor Kulübü",
          away_team: "Eceabat Spor Kulübü U16",
          score: "- : -",
          home_score: null,
          away_score: null,
          set_scores: [],
          status: "upcoming",
        },
      ]);

      expect(list[0].statusKey).toBe("partial");
      expect(list[0].syncedMatches).toBe(0);
    });

    it("returns 'teams_only' when teams are defined but no matches exist", () => {
      expect(
        evaluateGroupStatus({
          total: 0,
          dated: 0,
          synced: 0,
          finished: 0,
          teamsCount: 6,
        })
      ).toBe("teams_only");
    });

    it("returns 'no_matches' when no matches and no teams exist", () => {
      expect(
        evaluateGroupStatus({
          total: 0,
          dated: 0,
          synced: 0,
          finished: 0,
          teamsCount: 0,
        })
      ).toBe("no_matches");
    });
  });

  describe("computeGroupStatusList", () => {
    it("correctly groups matches and associates volleybox info", () => {
      const dummyMatches: Match[] = [
        {
          id: "m1",
          city: "İstanbul",
          category: "Genç Kızlar Süper Lig",
          age_group: "Genç",
          gender: "Kız",
          match_no: "1",
          group: "A Grubu",
          home_team: "VakıfBank",
          away_team: "Fenerbahçe",
          date: "2026-10-15",
          time: "14:00",
          hall: "50. Yıl",
          status: "upcoming",
          volleybox: { synced: true },
        },
        {
          id: "m2",
          city: "İstanbul",
          category: "Genç Kızlar Süper Lig",
          age_group: "Genç",
          gender: "Kız",
          match_no: "2",
          group: "A Grubu",
          home_team: "Eczacıbaşı",
          away_team: "Galatasaray",
          date: "2026-10-16",
          time: "16:00",
          hall: "50. Yıl",
          status: "upcoming",
          volleybox: { synced: true },
        },
      ];

      const list = computeGroupStatusList(dummyMatches);
      expect(list).toHaveLength(1);
      expect(list[0].city).toBe("İstanbul");
      expect(list[0].group).toBe("A Grubu");
      expect(list[0].statusKey).toBe("all_program_entered");
      expect(list[0].statusHex).toBe("#5B9DFF");
      expect(list[0].teamsCount).toBe(4);
      expect(list[0].tournamentUrl).toContain("women-stanbul-super-ligi-u18-2026-27-o50864");
    });
  });

  describe("Route synchronization for group-status", () => {
    it("generates correct route for group-status tab", () => {
      expect(getAppRoute("group-status")).toBe("/grup-durumu");
      expect(getAppRoute("group-status", "istanbul")).toBe("/grup-durumu/istanbul");
      expect(getAppRoute("group-status", "all")).toBe("/grup-durumu");
    });

    it("parses route correctly for group-status tab", () => {
      expect(parseAppRoute("/grup-durumu")).toEqual({
        tab: "group-status",
        city: "all",
      });
      expect(parseAppRoute("/grup-durumu/ankara")).toEqual({
        tab: "group-status",
        city: "ankara",
      });
      expect(parseAppRoute("/ankara/grup-durumu")).toEqual({
        tab: "group-status",
        city: "ankara",
      });
    });
  });
});
