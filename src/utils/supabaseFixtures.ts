import { getCityNameFromSlug } from "@/utils/cityHelper";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import type { FixturesData, Match, StandingItem } from "@/types/fixture";

function toMatch(row: Record<string, unknown>): Match {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
  return {
    ...(raw as Partial<Match>),
    id: String(row.id),
    city: String(row.city_name || row.city_slug || ""),
    date: String(row.match_date || ""),
    time: String(row.match_time || ""),
    hall: String(row.hall || ""),
    category: String(row.category || ""),
    age_group: String(row.age_group || ""),
    gender: String(row.gender || ""),
    group: String(row.group_name || ""),
    match_no: String(row.match_no || ""),
    home_team: String(row.home_team || ""),
    away_team: String(row.away_team || ""),
    score: (row.score as string | null) ?? null,
    home_score: (row.home_score as number | null) ?? null,
    away_score: (row.away_score as number | null) ?? null,
    set_scores: Array.isArray(row.set_scores) ? row.set_scores as string[] : [],
    status: (row.status as Match["status"]) || "upcoming",
    volleybox: (row.volleybox as Match["volleybox"]) || null,
  };
}

export async function getSupabaseFixtures(
  citySlug: string
): Promise<FixturesData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const isAllCities = citySlug === "all" || citySlug === "tumu" || citySlug === "turkiye";

  let matchesQuery = supabase
    .from("matches")
    .select(
      "id,city_slug,city_name,match_date,match_time,hall,category,age_group,gender,group_name,match_no,home_team,away_team,score,home_score,away_score,set_scores,status,volleybox,source_updated_at,updated_at"
    )
    .order("match_date");
  if (!isAllCities) {
    matchesQuery = matchesQuery.eq("city_slug", citySlug);
  }
  if (typeof (matchesQuery as { limit?: (n: number) => typeof matchesQuery }).limit === "function") {
    matchesQuery = matchesQuery.limit(5000);
  }

  let standingsQuery = isAllCities
    ? supabase.from("standings").select("city_slug,category,rows,source_updated_at,updated_at")
    : supabase.from("standings").select("city_slug,category,rows,source_updated_at,updated_at").eq("city_slug", citySlug);
  if (typeof (standingsQuery as { limit?: (n: number) => typeof standingsQuery }).limit === "function") {
    standingsQuery = standingsQuery.limit(5000);
  }

  const [
    { data: rows, error: matchesError },
    { data: standingRows, error: standingsError },
  ] = await Promise.all([matchesQuery, standingsQuery]);

  if (matchesError) {
    console.warn("Supabase fixtures okuma hatası (JSON fallback):", matchesError.message);
    return null;
  }

  const matches = (rows || []).map((row) => toMatch(row as Record<string, unknown>));
  const cityNames = new Map<string, string>();
  for (const match of matches) {
    const slug = String((match as Match & { city?: string }).city || "");
    if (slug) cityNames.set(slug, slug);
  }

  if (standingsError) {
    console.warn("Supabase standings okuma hatası (boş standings kullanılıyor):", standingsError.message);
  }

  const standings: Record<string, StandingItem[]> = {};
  for (const row of standingRows || []) {
    const cityName = getCityNameFromSlug(row.city_slug);
    const key = isAllCities
      ? `${cityName} - ${row.category}`
      : row.category;
    standings[key] = Array.isArray(row.rows) ? row.rows : [];
  }

  const categories = Array.from(new Set(matches.map((match) => match.category).filter(Boolean)));
  const halls = Array.from(new Set(matches.map((match) => match.hall).filter(Boolean)));
  const updatedAt =
    (rows || [])
      .map(
        (r) =>
          (r as { source_updated_at?: string; updated_at?: string; raw?: { source_updated_at?: string } })
            .source_updated_at ||
          (r as { raw?: { source_updated_at?: string } }).raw?.source_updated_at ||
          (r as { updated_at?: string }).updated_at
      )
      .filter((v): v is string => Boolean(v))
      .sort()
      .pop() || new Date().toISOString();

  return {
    city: citySlug === "all" || citySlug === "tumu" || citySlug === "turkiye"
      ? "Tüm İller"
      : cityNames.values().next().value || citySlug,
    title: "TVF Tüm İller Genç & Yıldız Kızlar Süper Lig",
    updated_at: updatedAt,
    total_matches: matches.length,
    source: "Supabase / TVF İl Temsilcilikleri",
    filters: {
      categories: ["Tümü", ...categories],
      age_groups: ["Tümü", "Genç", "Yıldız"],
      genders: ["Tümü", "Kız", "Erkek", "Kadın"],
      halls: ["Tümü", ...halls],
    },
    matches,
    standings,
  };
}
/**
 * /api/fixtures için instance içi kısa paylaşım. Supabase'den gelen tüm iller yanıtı ~1 MB JSON'dur;
 * CDN önbelleği düştüğünde farklı bölgelerden/sorgu varyantlarından aynı anda gelen ıskalar aynı
 * veriyi tekrar tekrar ayrıştırıp Fluid Active CPU harcıyordu. 30 sn + CDN s-maxage=270 sn ile
 * yeni skorlar en geç ~5 dakikada görünür.
 */
export const SUPABASE_FIXTURES_TTL_MS = 30 * 1000;
const fixturesMemo = new Map<string, { at: number; promise: Promise<FixturesData | null> }>();

export function getSupabaseFixturesCached(citySlug: string): Promise<FixturesData | null> {
  const key = citySlug === "tumu" || citySlug === "turkiye" ? "all" : citySlug;
  const now = Date.now();
  const hit = fixturesMemo.get(key);
  if (hit && now - hit.at < SUPABASE_FIXTURES_TTL_MS) return hit.promise;

  const promise = getSupabaseFixtures(citySlug);
  const entry = { at: now, promise };
  fixturesMemo.set(key, entry);
  // Boş/başarısız sonuçları önbellekte tutma (JSON fallback'e düşülen durumlar).
  promise.then(
    (data) => {
      if ((!data || !Array.isArray(data.matches) || data.matches.length === 0) && fixturesMemo.get(key) === entry) {
        fixturesMemo.delete(key);
      }
    },
    () => {
      if (fixturesMemo.get(key) === entry) fixturesMemo.delete(key);
    }
  );
  return promise;
}

export function clearSupabaseFixturesCache(): void {
  fixturesMemo.clear();
}
