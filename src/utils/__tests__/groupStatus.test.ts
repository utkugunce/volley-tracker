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
        hex: "#00b050",
      })
    );

    expect(GROUP_STATUS_CONFIGS.partial).toEqual(
      expect.objectContaining({
        label: "Kısmen girildi",
        hex: "#ffff00",
      })
    );

    expect(GROUP_STATUS_CONFIGS.not_entered).toEqual(
      expect.objectContaining({
        label: "Maçlar girilmedi",
        hex: "#ff0000",
      })
    );

    expect(GROUP_STATUS_CONFIGS.no_matches).toEqual(
      expect.objectContaining({
        label: "Maç Yok",
        hex: "#404040",
      })
    );

    expect(GROUP_STATUS_CONFIGS.teams_only).toEqual(
      expect.objectContaining({
        label: "Takımlar belli fikstür yok",
        hex: "#f79646",
      })
    );

    expect(GROUP_STATUS_CONFIGS.all_program_entered).toEqual(
      expect.objectContaining({
        label: "Programdaki tüm maçlar girildi",
        hex: "#1f497d",
      })
    );

    expect(GROUP_STATUS_CONFIGS.finished).toEqual(
      expect.objectContaining({
        label: "Lig Bitti",
        hex: "#7030a0",
      })
    );
  });

  describe("evaluateGroupStatus", () => {
    it("returns 'finished' when all matches are finished", () => {
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

    it("returns 'all_program_entered' when all matches in the program are synced", () => {
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
      expect(list[0].statusHex).toBe("#1f497d");
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
