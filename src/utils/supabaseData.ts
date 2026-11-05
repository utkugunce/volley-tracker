import { getSupabaseAdmin } from "./supabaseAdmin";
import type { CityEntry } from "./cityHelper";
import type { TeamRostersDatabase } from "@/types/roster";

export type ActiveDataSource = "supabase" | "json-fallback";

const CACHE_TTL_MS = 60 * 1000;

interface CacheEntry<T> {
  at: number;
  data: T;
}

let citiesCache: CacheEntry<CityEntry[]> | null = null;
let rostersCache: CacheEntry<TeamRostersDatabase> | null = null;

/**
 * Supabase üzerinden şehir indeksini okur; erişilemezse null döner (JSON yedeğine düşer).
 */
export async function getSupabaseCitiesCached(): Promise<CityEntry[] | null> {
  const now = Date.now();
  if (citiesCache && now - citiesCache.at < CACHE_TTL_MS) {
    return citiesCache.data;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select("city, city_slug");

    if (error || !matches || matches.length === 0) {
      return null;
    }

    const cityMap = new Map<string, string>();
    for (const m of matches) {
      if (m.city_slug && m.city && !cityMap.has(m.city_slug)) {
        cityMap.set(m.city_slug, m.city);
      }
    }

    const cities: CityEntry[] = Array.from(cityMap.entries()).map(([slug, name], idx) => ({
      ilid: String(idx + 1),
      name,
      slug,
    }));

    citiesCache = { at: now, data: cities };
    return cities;
  } catch (err) {
    console.warn("Supabase cities okuma hatası:", err);
    return null;
  }
}

/**
 * Supabase üzerinden takım kadro verisini sorgular; erişilemezse null döner.
 */
export async function getSupabaseTeamRostersCached(): Promise<TeamRostersDatabase | null> {
  const now = Date.now();
  if (rostersCache && now - rostersCache.at < CACHE_TTL_MS) {
    return rostersCache.data;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  return null; // Kadro tablosu henüz yoksa JSON yedeğine düş
}

/**
 * Şehir listesini önce Supabase'den (bellek içi önbellekle) okur,
 * erişilemezse veya boş dönerse data/cities.json disk yedeğine düşer.
 */
export async function loadCitiesWithFallback(): Promise<CityEntry[]> {
  try {
    const fromSupabase = await getSupabaseCitiesCached();
    if (fromSupabase && fromSupabase.length > 0) {
      return fromSupabase;
    }
  } catch (err) {
    console.warn("Supabase cities fallback:", err);
  }
  const { getAllCitiesList } = await import("./cityHelper");
  return getAllCitiesList();
}

/**
 * Takım kadrolarını önce Supabase'den sorgular,
 * bulunamazsa data/team-rosters.json disk yedeğine düşer.
 */
export async function loadTeamRostersWithFallback(): Promise<TeamRostersDatabase> {
  try {
    const fromSupabase = await getSupabaseTeamRostersCached();
    if (fromSupabase && Object.keys(fromSupabase).length > 0) {
      return fromSupabase;
    }
  } catch (err) {
    console.warn("Supabase rosters fallback:", err);
  }
  const { loadTeamRosters } = await import("./team/loaders");
  return loadTeamRosters();
}
