import { describe, expect, it } from "vitest";
import type { Match, StandingItem } from "@/types/fixture";
import {
  buildVolleyboxWorkbenchData,
  detectStandingsAnomalies,
  formatMatchForVolleyboxCopy,
  formatSetScoresForVolleybox,
  getResolvedVolleyboxHallName,
  getResolvedVolleyboxTeamName,
  getVolleyboxTournamentMatchesUrl,
  toVolleyboxMatchesUrl,
} from "../volleyboxWorkbench";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m-1",
    city: "İstanbul",
    date: "2026-10-20",
    time: "14:00",
    hall: "TVF 50. Yıl Deniz Esinduy",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "101",
    home_team: "VakıfBank",
    away_team: "Fenerbahçe",
    status: "upcoming",
    ...overrides,
  };
}

describe("volleyboxWorkbench utility", () => {
  it("formatSetScoresForVolleybox normalizes parentheses, colons, dashes, and spacing", () => {
    expect(formatSetScoresForVolleybox(["(25-18)", "22 : 25", "25 – 14"])).toBe("25-18, 22-25, 25-14");
    expect(formatSetScoresForVolleybox([])).toBe("");
    expect(formatSetScoresForVolleybox(undefined)).toBe("");
  });

  it("formatMatchForVolleyboxCopy resolves Volleybox names and includes date, score, sets, and hall", () => {
    const m = makeMatch({
      home_score: 3,
      away_score: 1,
      score: "3 - 1",
      status: "finished",
      set_scores: ["25-18", "22-25", "25-20", "25-19"],
    });
    const text = formatMatchForVolleyboxCopy(m, "İstanbul");
    expect(text).toContain("2026-10-20 14:00");
    expect(text).toContain("3-1 (25-18, 22-25, 25-20, 25-19)");
    expect(text).toContain("50. Yıl Deniz Esinduy Voleybol Salonu");
    expect(text).toContain(getResolvedVolleyboxTeamName("VakıfBank", m.category, "İstanbul"));
  });

  it("toVolleyboxMatchesUrl and getVolleyboxTournamentMatchesUrl produce editable /tr/.../matches URLs", () => {
    expect(toVolleyboxMatchesUrl("https://women.volleybox.net/istanbul-genc-kizlar-super-ligi-o35611")).toBe(
      "https://women.volleybox.net/tr/istanbul-genc-kizlar-super-ligi-o35611/matches"
    );
    expect(toVolleyboxMatchesUrl("https://women.volleybox.net/tr/istanbul-u18-o123/matches/")).toBe(
      "https://women.volleybox.net/tr/istanbul-u18-o123/matches"
    );
    expect(toVolleyboxMatchesUrl("")).toBeNull();

    const matchesUrl = getVolleyboxTournamentMatchesUrl("Genç Kızlar Süper Lig", "İstanbul");
    if (matchesUrl) {
      expect(matchesUrl).toContain("https://women.volleybox.net/tr/");
      expect(matchesUrl.endsWith("/matches")).toBe(true);
    }
  });

  it("getResolvedVolleyboxHallName resolves TVF hall to synced Volleybox arena name or curated mapping", () => {
    const dataset: Match[] = [
      makeMatch({
        id: "synced-hall",
        city: "İstanbul",
        hall: "Bahçelievler Hasan Doğan Spor Salonu",
        volleybox: {
          synced: true,
          vb_hall: "Hasan Doğan Spor Kompleksi",
        },
      }),
    ];

    expect(getResolvedVolleyboxHallName("Hasan Doğan S.S.", "İstanbul", dataset)).toBe(
      "Hasan Doğan Spor Kompleksi"
    );
    expect(getResolvedVolleyboxHallName("TVF 50. Yıl Deniz Esinduy", "İstanbul")).toBe(
      "50. Yıl Deniz Esinduy Voleybol Salonu"
    );
    expect(getResolvedVolleyboxHallName("Bilinmeyen Salon", "Ankara")).toBe("Bilinmeyen Salon");
    expect(getResolvedVolleyboxHallName("TBD", "İstanbul")).toBe("");
  });

  it("buildVolleyboxWorkbenchData classifies missingScores, discrepancies, unsynced, unmappedTeams", () => {
    const matches: Match[] = [
      // 1. Missing score in VB (TVF finished, VB synced but !has_score)
      makeMatch({
        id: "m-missing-score",
        date: "2026-10-19",
        status: "finished",
        home_score: 3,
        away_score: 0,
        score: "3 - 0",
        set_scores: ["25-15", "25-18", "25-14"],
        volleybox: {
          synced: true,
          match_id: 9001,
          url: "https://women.volleybox.net/m9001",
          has_score: false,
        },
      }),
      // 2. Discrepancy (date/time changed in TVF bulletin)
      makeMatch({
        id: "m-disc",
        date: "2026-10-22",
        time: "16:30",
        volleybox: {
          synced: true,
          match_id: 9002,
          url: "https://women.volleybox.net/m9002",
          has_score: false,
          vb_date: "2026-10-20",
          vb_time: "14:00",
          discrepancy: {
            has_diff: true,
            date_diff: true,
            time_diff: true,
            vb_date: "2026-10-20",
            vb_time: "14:00",
          },
        },
      }),
      // 3. Unsynced dated match with unmapped teams
      makeMatch({
        id: "m-unsynced",
        date: "2026-10-25",
        home_team: "X Bilinmeyen Kulüp A",
        away_team: "Y Bilinmeyen Kulüp B",
        volleybox: {
          synced: false,
        },
      }),
      // 4. TBD match should NOT be counted in unsynced queue
      makeMatch({
        id: "m-tbd",
        date: "TBD",
        home_team: "X Bilinmeyen Kulüp A",
        away_team: "VakıfBank",
      }),
    ];

    const result = buildVolleyboxWorkbenchData(matches);
    expect(result.missingScores.map((m) => m.id)).toEqual(["m-missing-score"]);
    expect(result.discrepancies.map((m) => m.id)).toEqual(["m-disc"]);
    expect(result.unsynced.map((m) => m.id)).toEqual(["m-unsynced"]);

    const unmappedNames = result.unmappedTeams.map((t) => t.teamName);
    expect(unmappedNames).toContain("X Bilinmeyen Kulüp A");
    expect(unmappedNames).toContain("Y Bilinmeyen Kulüp B");
    const xTeam = result.unmappedTeams.find((t) => t.teamName === "X Bilinmeyen Kulüp A");
    expect(xTeam?.matchCount).toBe(2);
    expect(xTeam?.volleyboxSearchUrl).toContain("https://women.volleybox.net/tr/search?q=");

    expect(result.counts.totalValidMatches).toBe(3);
    expect(result.counts.syncedMatches).toBe(2);
    expect(result.counts.syncPercent).toBe(67);
  });

  it("detectStandingsAnomalies flags forfeit groups and played/won mismatches", () => {
    const matches: Match[] = [
      makeMatch({
        id: "m-forfeit",
        city: "Ankara",
        category: "Genç Kızlar Süper Lig",
        group: "1. Grup",
        home_team: "Takım A",
        away_team: "Takım B",
        home_score: 3,
        away_score: 0,
        score: "3 - 0",
        set_scores: ["25-0", "25-0", "25-0"],
        status: "finished",
      }),
    ];

    const standings: Record<string, StandingItem[]> = {
      "Ankara - Genç Kızlar Süper Lig - 1. Grup": [
        {
          rank: 1,
          team: "Takım A",
          played: 2, // TVF table has 2, only 1 finished match scraped
          won: 2,
          lost: 0,
          points: 6,
          sets_won: 6,
          sets_lost: 0,
          set_ratio: "MAX",
          points_won: 150,
          points_lost: 0,
          point_ratio: "MAX",
          form: ["W", "W"],
        },
        {
          rank: 2,
          team: "Takım B",
          played: 1,
          won: 0,
          lost: 1,
          points: 0,
          sets_won: 0,
          sets_lost: 3,
          set_ratio: "0.00",
          points_won: 0,
          points_lost: 75,
          point_ratio: "0.00",
          form: ["L"],
        },
      ],
    };

    const anomalies = detectStandingsAnomalies(matches, standings);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].forfeitMatchCount).toBe(1);
    expect(anomalies[0].discrepancyTeams).toHaveLength(1);
    expect(anomalies[0].discrepancyTeams[0]).toMatchObject({
      team: "Takım A",
      tvfPlayed: 2,
      calcPlayed: 1,
    });
  });
});
