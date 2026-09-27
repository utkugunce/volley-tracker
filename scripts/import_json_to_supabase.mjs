import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY zorunludur.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const root = process.cwd();
const citiesDir = path.join(root, "data", "cities");
const files = fs.readdirSync(citiesDir).filter((file) => file.endsWith(".json"));
let importedMatches = 0;
let importedStandings = 0;

for (const file of files) {
  const citySlug = file.replace(/\.json$/, "");
  const parsed = JSON.parse(fs.readFileSync(path.join(citiesDir, file), "utf8"));
  const matches = (parsed.matches || []).map((match) => ({
    id: match.id,
    city_slug: citySlug,
    city_name: parsed.city || match.city || citySlug,
    match_date: match.date || null,
    match_time: match.time || null,
    hall: match.hall || null,
    category: match.category || null,
    age_group: match.age_group || null,
    gender: match.gender || null,
    group_name: match.group || null,
    match_no: match.match_no || null,
    home_team: match.home_team,
    away_team: match.away_team,
    score: match.score || null,
    home_score: match.home_score ?? null,
    away_score: match.away_score ?? null,
    set_scores: match.set_scores || [],
    status: match.status || "upcoming",
    volleybox: match.volleybox || null,
    raw: match,
    source_updated_at: parsed.updated_at || null,
    updated_at: new Date().toISOString(),
  }));

  if (matches.length) {
    const { error } = await supabase.from("matches").upsert(matches, { onConflict: "id" });
    if (error) throw new Error(`${citySlug} matches: ${error.message}`);
    importedMatches += matches.length;
  }

  const standings = Object.entries(parsed.standings || {}).map(([category, rows]) => ({
    city_slug: citySlug,
    category,
    rows,
    source_updated_at: parsed.updated_at || null,
    updated_at: new Date().toISOString(),
  }));
  if (standings.length) {
    const { error } = await supabase
      .from("standings")
      .upsert(standings, { onConflict: "city_slug,category" });
    if (error) throw new Error(`${citySlug} standings: ${error.message}`);
    importedStandings += standings.length;
  }
}

const { error: runError } = await supabase.from("sync_runs").insert({
  source: "json-import",
  status: "success",
  finished_at: new Date().toISOString(),
  cities_scanned: files.length,
  matches_imported: importedMatches,
  metadata: { standings_imported: importedStandings },
});
if (runError) throw new Error(`sync_runs: ${runError.message}`);

console.log(JSON.stringify({
  citiesScanned: files.length,
  matchesImported: importedMatches,
  standingsImported: importedStandings,
}, null, 2));