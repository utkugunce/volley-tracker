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

  let matchesQuery = supabase.from("matches").select("*").order("match_date");
  if (citySlug !== "all" && citySlug !== "tumu" && citySlug !== "turkiye") {
    matchesQuery = matchesQuery.eq("city_slug", citySlug);
  }

  const { data: rows, error: matchesError } = await matchesQuery;
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

  const standingsQuery = citySlug === "all" || citySlug === "tumu" || citySlug === "turkiye"
    ? supabase.from("standings").select("*")
    : supabase.from("standings").select("*").eq("city_slug", citySlug);
  const { data: standingRows, error: standingsError } = await standingsQuery;
  if (standingsError) {
    console.warn("Supabase standings okuma hatası (boş standings kullanılıyor):", standingsError.message);
  }

  const standings: Record<string, StandingItem[]> = {};
  for (const row of standingRows || []) {
    const key = citySlug === "all"
      ? `${row.city_slug} - ${row.category}`
      : row.category;
    standings[key] = Array.isArray(row.rows) ? row.rows : [];
  }

  const categories = Array.from(new Set(matches.map((match) => match.category).filter(Boolean)));
  const halls = Array.from(new Set(matches.map((match) => match.hall).filter(Boolean)));
  const updatedAt = matches
    .map((match) => (match as Match & { raw?: { source_updated_at?: string } }).raw?.source_updated_at)
    .filter(Boolean)
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