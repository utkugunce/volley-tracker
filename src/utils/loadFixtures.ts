import { reportDataEvent } from "./dataEvents";
import { getInitialFixtures, getInitialHomeFixtures as selectHome, getInitialResults as selectResults } from "./getInitialFixtures";
import { getSupabaseFixturesCached } from "./supabaseFixtures";
import { reconcileWithLocalFixtures } from "./fixtureReconciliation";
import { applyOverridesToMatchesAsync } from "./overrides";
import { isCityHidden } from "./cityHelper";
import type { FixturesData } from "@/types/fixture";

/** Shared SSR/API policy: Supabase, score-preserving local reconciliation, then manual overrides. */
export async function loadFixtures(city = "all"): Promise<FixturesData> {
  const slug = ["tumu", "turkiye", "Tüm İller"].includes(city) ? "all" : city;
  if (isCityHidden(slug)) throw new Error("Hidden city");
  let remote: FixturesData | null = null;
  try { remote = await getSupabaseFixturesCached(slug); }
  catch { reportDataEvent("fallback", slug); }
  const useRemote = Boolean(remote && (remote.matches.length || Object.keys(remote.standings || {}).length));
  const base = useRemote ? reconcileWithLocalFixtures(remote!, slug) : getInitialFixtures(slug);
  const matches = await applyOverridesToMatchesAsync(base.matches || []);
  return { ...base, matches, total_matches: matches.length, data_source: useRemote ? "supabase" : "json-fallback" };
}
export const getInitialFixturesResolved = loadFixtures;
export async function getInitialHomeFixtures() { return selectHome(await loadFixtures("all")); }
export async function getInitialResults(city = "all") { return selectResults(city, await loadFixtures(city)); }
