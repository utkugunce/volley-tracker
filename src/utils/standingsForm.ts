import { StandingItem, Match } from "@/types/fixture";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { formatGroupName } from "@/utils/grouping";

export type FormResult = "W" | "L";

export interface TeamMatchSummary {
  form: FormResult[];
  formSource: "matches" | "standings" | "none";
  last: Match | null;
  next: Match | null;
}

function hasScore(m: Match): boolean {
  return (m.home_score != null && m.away_score != null) || !!m.score;
}

const normGroup = (g: string) => trLower(g).replace(/[^a-z0-9ğüşıöç]/gi, "");

/** Maç grubu ile puan durumu grubu aynı mı? ("A Grubu" ≈ "Genç Kızlar Süper Lig - A Gr") */
function sameGroup(matchGroup: string, standingGroup: string): boolean {
  const a = normGroup(formatGroupName(matchGroup));
  const b = normGroup(formatGroupName(standingGroup));
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

export function summarizeTeam(
  row: StandingItem,
  ctx: { city: string; leagueName: string; groupName: string } | null,
  matches?: Match[]
): TeamMatchSummary {
  const fallback = (row.form || []).slice(-5) as FormResult[];
  const empty: TeamMatchSummary = {
    form: fallback,
    formSource: fallback.length ? "standings" : "none",
    last: null,
    next: null,
  };
  if (!matches?.length) return empty;

  const name = trLower(row.team.trim());

  const mine = matches.filter((m) => {
    const home = trLower(m.home_team.trim());
    const away = trLower(m.away_team.trim());
    if (!trIncludes(home, name) && !trIncludes(away, name) && !trIncludes(name, home) && !trIncludes(name, away))
      return false;
    if (ctx) {
      if (ctx.city && m.city && trLower(m.city) !== trLower(ctx.city)) return false;
      if (ctx.leagueName && m.category && !trIncludes(trLower(m.category), trLower(ctx.leagueName)) && !trIncludes(trLower(ctx.leagueName), trLower(m.category)))
        return false;
      if (ctx.groupName && m.group && !sameGroup(m.group, ctx.groupName)) return false;
    }
    return true;
  });

  if (!mine.length) return empty;

  const key = (m: Match) => `${m.date} ${m.time || ""}`;
  const finished = mine
    .filter((m) => m.status === "finished" && hasScore(m))
    .sort((a, b) => key(a).localeCompare(key(b)));
  const upcoming = mine
    .filter((m) => m.status === "upcoming" || m.status === "live")
    .sort((a, b) => key(a).localeCompare(key(b)));

  const form: FormResult[] = finished.slice(-5).map((m) => {
    const home = trLower(m.home_team.trim());
    const isHome = trIncludes(home, name) || trIncludes(name, home);
    const myScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const theirScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    return myScore > theirScore ? "W" : "L";
  });

  return {
    form: form.length ? form : fallback,
    formSource: form.length ? "matches" : fallback.length ? "standings" : "none",
    last: finished.at(-1) ?? null,
    next: upcoming[0] ?? null,
  };
}
