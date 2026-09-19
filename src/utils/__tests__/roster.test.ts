import { describe, it, expect } from "vitest";
import { extractVolleyboxTeamId, loadTeamRosters, getTeamDetailsBySlug } from "../teamData";

describe("Volleybox Roster System", () => {
  describe("extractVolleyboxTeamId", () => {
    it("extracts team id from standard volleybox urls", () => {
      expect(extractVolleyboxTeamId("https://women.volleybox.net/vakfbank-u18-t19499")).toBe("t19499");
      expect(extractVolleyboxTeamId("https://women.volleybox.net/fenerbahce-u18-t27716")).toBe("t27716");
      expect(extractVolleyboxTeamId("https://women.volleybox.net/t36341")).toBe("t36341");
    });

    it("returns null for empty or undefined url", () => {
      expect(extractVolleyboxTeamId(undefined)).toBeNull();
      expect(extractVolleyboxTeamId("")).toBeNull();
    });
  });

  describe("loadTeamRosters", () => {
    it("loads team-rosters database successfully", () => {
      const rosters = loadTeamRosters();
      expect(typeof rosters).toBe("object");
      expect(rosters).not.toBeNull();
      // En azından VakıfBank veya t19499 bulunmalıdır
      expect(rosters["t19499"]).toBeDefined();
      expect(rosters["t19499"].volleybox_url).toContain("vakfbank-u18-t19499");
    });
  });

  describe("getTeamDetailsBySlug with Volleybox Roster", () => {
    it("attaches authentic volleyboxRoster to VakıfBank", () => {
      const team = getTeamDetailsBySlug("vakifbank", "istanbul");
      expect(team).not.toBeNull();
      expect(team?.volleyboxRoster).toBeDefined();
      expect(team?.volleyboxRoster?.seasons).toBeDefined();

      const seasons = team!.volleyboxRoster!.seasons;
      // 2025/26 veya 2026/27 sezonu bulunmalı
      const availableSeasons = Object.keys(seasons);
      expect(availableSeasons.length).toBeGreaterThan(0);

      // Oyuncuların en az bir sezonda mevcut olduğunu doğrula
      const totalPlayersAcrossSeasons = Object.values(seasons).reduce(
        (acc, s) => acc + s.total_players,
        0
      );
      expect(totalPlayersAcrossSeasons).toBeGreaterThan(0);

      // Legacy roster listesinin de otomatik doldurulduğunu doğrula
      expect(team?.roster).toBeDefined();
      expect(team?.roster?.length).toBeGreaterThan(0);
      expect(team?.roster?.[0].name).toBeTruthy();
    });

    it("attaches authentic volleyboxRoster to Fenerbahçe", () => {
      const team = getTeamDetailsBySlug("fenerbahce");
      expect(team).not.toBeNull();
      expect(team?.volleyboxRoster).toBeDefined();
      expect(team?.volleyboxRoster?.seasons).toBeDefined();
    });
  });
});
