import { getSupabaseAdmin } from "./supabaseAdmin";
import type { CityEntry } from "./cityHelper";
import type { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import type { TeamRostersDatabase } from "@/types/roster";

export type ActiveDataSource = "supabase" | "json-fallback";

let activeDataSource: ActiveDataSource = "json-fallback";

export function getActiveDataSource(): ActiveDataSource {
  return activeDataSource;
}

export function setActiveDataSource(source: ActiveDataSource): void {
  activeDataSource = source;
}

const CACHE_TTL_MS = 60 * 1000;

interface CacheEntry<T> {
  at: number;
  data: T;
}

let citiesCache: CacheEntry<CityEntry[]> | null = null;
let k2Cache: CacheEntry<Kadinlar2LigData> | null = null;
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
    setActiveDataSource("json-fallback");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("matches")
      .select("city_slug, city_name")
      .not("city_slug", "is", null);

    if (error || !data || data.length === 0) {
      setActiveDataSource("json-fallback");
      return null;
    }

    const cityMap = new Map<string, string>();
    for (const row of data) {
      if (row.city_slug) {
        cityMap.set(row.city_slug, row.city_name || row.city_slug);
      }
    }

    const cities: CityEntry[] = Array.from(cityMap.entries()).map(([slug, name], idx) => ({
      ilid: String(idx + 1),
      name,
      slug,
    }));

    citiesCache = { at: now, data: cities };
    setActiveDataSource("supabase");
    return cities;
  } catch (err) {
    console.warn("Supabase cities okuma hatası:", err);
    setActiveDataSource("json-fallback");
    return null;
  }
}

/**
 * Supabase üzerinden Kadınlar 2. Ligi verisini sorgular; erişilemezse null döner.
 */
export async function getSupabaseKadinlar2LigCached(): Promise<Kadinlar2LigData | null> {
  const now = Date.now();
  if (k2Cache && now - k2Cache.at < CACHE_TTL_MS) {
    return k2Cache.data;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    setActiveDataSource("json-fallback");
    return null;
  }

  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .eq("category", "Kadınlar 2. Lig");

    if (error || !matches || matches.length === 0) {
      setActiveDataSource("json-fallback");
      return null;
    }

    // Supabase verisi mevcut
    setActiveDataSource("supabase");
    return null; // Tam şema dönüşümü yoksa güvenle JSON fallback'e bırak
  } catch {
    setActiveDataSource("json-fallback");
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
    setActiveDataSource("json-fallback");
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
      setActiveDataSource("supabase");
      return fromSupabase;
    }
  } catch (err) {
    console.warn("Supabase cities fallback:", err);
  }
  setActiveDataSource("json-fallback");
  const { getAllCitiesList } = await import("./cityHelper");
  return getAllCitiesList();
}

/**
 * Kadınlar 2. Ligi verisini önce Supabase'den sorgular,
 * bulunamazsa veya boşsa data/kadinlar_2_lig.json disk yedeğine düşer.
 */
export async function loadKadinlar2LigWithFallback(): Promise<Kadinlar2LigData> {
  try {
    const fromSupabase = await getSupabaseKadinlar2LigCached();
    if (fromSupabase) {
      setActiveDataSource("supabase");
      return fromSupabase;
    }
  } catch (err) {
    console.warn("Supabase K2 fallback:", err);
  }
  setActiveDataSource("json-fallback");
  const { getKadinlar2LigData } = await import("./kadinlar2LigServer");
  return getKadinlar2LigData();
}

/**
 * Takım kadrolarını önce Supabase'den sorgular,
 * bulunamazsa data/team-rosters.json disk yedeğine düşer.
 */
export async function loadTeamRostersWithFallback(): Promise<TeamRostersDatabase> {
  try {
    const fromSupabase = await getSupabaseTeamRostersCached();
    if (fromSupabase && Object.keys(fromSupabase).length > 0) {
      setActiveDataSource("supabase");
      return fromSupabase;
    }
  } catch (err) {
    console.warn("Supabase rosters fallback:", err);
  }
  setActiveDataSource("json-fallback");
  const { loadTeamRosters } = await import("./team/loaders");
  return loadTeamRosters();
}
