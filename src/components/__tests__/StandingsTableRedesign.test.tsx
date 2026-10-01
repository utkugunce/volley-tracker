import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StandingsTable, summarizeTeam } from "../StandingsTable";
import type { Match, StandingItem } from "@/types/fixture";

const row: StandingItem = {
  rank: 1,
  team: "Eczacıbaşı A",
  played: 5,
  won: 5,
  lost: 0,
  points: 15,
  sets_won: 15,
  sets_lost: 1,
  set_ratio: "15.00",
  points_won: 375,
  points_lost: 250,
  point_ratio: "1.50",
  form: [],
};

const mk = (i: number, home: string, away: string, hs: number | null, as: number | null, status: Match["status"]): Match => ({
  id: `m${i}`,
  city: "İstanbul",
  date: `2026-09-${String(10 + i).padStart(2, "0")}`,
  time: "12:00",
  hall: "Salon",
  category: "Genç Kızlar Süper Lig",
  age_group: "Genç",
  gender: "Kız",
  group: "A Grubu",
  match_no: String(i),
  home_team: home,
  away_team: away,
  home_score: hs,
  away_score: as,
  status,
});

describe("StandingsTable yeniden tasarım (aşama 04)", () => {
  it("satıra tıklayınca satır içi detay açılır ve aria-expanded=true olur", () => {
    render(<StandingsTable standingsData={{ "Genç Kızlar Süper Lig - A Grubu": [row] }} />);
    expect(document.querySelector("[data-detail-for]")).toBeNull();
    const btn = screen.getByRole("button", { name: "Eczacıbaşı A takımını incele" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(document.querySelector('[data-detail-for="Eczacıbaşı A"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Eczacıbaşı A takımını incele" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("summarizeTeam: maç verisinden son 5 maç G/M türetir", () => {
    const ms = [
      mk(1, "Eczacıbaşı A", "X", 3, 0, "finished"),
      mk(2, "Y", "Eczacıbaşı A", 1, 3, "finished"),
      mk(3, "Eczacıbaşı A", "Z", 3, 2, "finished"),
      mk(4, "Eczacıbaşı A", "W", 0, 3, "finished"),
      mk(5, "V", "Eczacıbaşı A", 0, 3, "finished"),
      mk(6, "Eczacıbaşı A", "U", 3, 0, "finished"),
      mk(7, "Eczacıbaşı A", "T", null, null, "upcoming"),
    ];
    const s = summarizeTeam(row, { city: "İstanbul", leagueName: "Genç Kızlar Süper Lig", groupName: "A Grubu" }, ms);
    expect(s.formSource).toBe("matches");
    expect(s.form).toEqual(["W", "W", "L", "W", "W"]);
    expect(s.last?.id).toBe("m6");
    expect(s.next?.id).toBe("m7");
  });

  it("summarizeTeam: eşleşme yoksa standings / none dallarına düşer", () => {
    const ctx = { city: "İstanbul", leagueName: "Genç Kızlar Süper Lig", groupName: "A Grubu" };
    const withForm = summarizeTeam({ ...row, form: ["W", "L"] as any }, ctx, []);
    expect(withForm.formSource).toBe("standings");
    expect(withForm.form).toEqual(["W", "L"]);
    const none = summarizeTeam(row, ctx, [mk(1, "Galatasaray", "Fenerbahçe", 3, 0, "finished")]);
    expect(none.formSource).toBe("none");
    expect(none.form).toEqual([]);
  });

  it("farklı gruptaki aynı isimli takımın maçları forma karışmaz", () => {
    const other = { ...mk(1, "Eczacıbaşı A", "X", 3, 0, "finished"), group: "B Grubu" };
    const s = summarizeTeam(row, { city: "İstanbul", leagueName: "Genç Kızlar Süper Lig", groupName: "A Grubu" }, [other]);
    expect(s.formSource).toBe("none");
  });
});
