// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { loadFixtures } from "../loadFixtures";
import { getSupabaseFixturesCached } from "../supabaseFixtures";
import { getInitialFixtures } from "../getInitialFixtures";
import { applyOverridesToMatchesAsync } from "../overrides";
import type { FixturesData } from "@/types/fixture";
vi.mock("../supabaseFixtures");
vi.mock("../getInitialFixtures");
vi.mock("../overrides");
const local = { city: "Afyonkarahisar", source: "TVF", updated_at: "2026-11-05", total_matches: 1, matches: [{ id: "m", date: "2026-11-05", home_team: "A", away_team: "B", home_score: 3, away_score: 1, status: "finished" }], standings: {}, filters: {} } as FixturesData;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getInitialFixtures).mockReturnValue(structuredClone(local));
  vi.mocked(applyOverridesToMatchesAsync).mockImplementation(async matches => matches);
});
it("falls back on remote errors without sharing provenance between requests", async () => {
  vi.mocked(getSupabaseFixturesCached).mockRejectedValueOnce(new Error("offline"));
  expect((await loadFixtures("afyon")).data_source).toBe("json-fallback");
  vi.mocked(getSupabaseFixturesCached).mockResolvedValueOnce(local);
  expect((await loadFixtures("afyon")).data_source).toBe("supabase");
});
it("preserves known local scores then applies the manual correction last", async () => {
  const remote = structuredClone(local);
  Object.assign(remote.matches[0], { status: "upcoming", home_score: null, away_score: null });
  vi.mocked(getSupabaseFixturesCached).mockResolvedValue(remote);
  vi.mocked(applyOverridesToMatchesAsync).mockImplementation(async matches => {
    expect(matches[0].home_score).toBe(3);
    return matches.map(m => ({ ...m, home_score: 2, away_score: 3, is_overridden: true }));
  });
  expect((await loadFixtures("afyon")).matches[0].home_score).toBe(2);
});
it("accepts standings-only cities and blocks hidden cities before remote access", async () => {
  vi.mocked(getSupabaseFixturesCached).mockResolvedValue({ ...local, matches: [], standings: { league: [] } });
  expect((await loadFixtures("afyon")).data_source).toBe("supabase");
  await expect(loadFixtures("nigde")).rejects.toThrow("Hidden city");
  expect(getSupabaseFixturesCached).toHaveBeenCalledTimes(1);
});
