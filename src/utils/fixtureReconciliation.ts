import type { FixturesData, Match } from "@/types/fixture";
import { getInitialFixtures } from "./getInitialFixtures";

function matchIdentityKey(m: Match): string {
  return `${m.date || ""}|${(m.home_team || "").trim()}|${(m.away_team || "").trim()}`;
}

function isSameFixtureMatch(a: Match, b: Match): boolean {
  return (
    (a.home_team || "").trim() === (b.home_team || "").trim() &&
    (a.away_team || "").trim() === (b.away_team || "").trim() &&
    (a.date || "") === (b.date || "")
  );
}

export function reconcileWithLocalFixtures(supabaseData: FixturesData, citySlug: string): FixturesData {
  try {
    const targetSlug = citySlug === "tumu" || citySlug === "turkiye" ? "all" : citySlug;
    const localData = getInitialFixtures(targetSlug);
    if (!localData || !Array.isArray(localData.matches) || localData.matches.length === 0) {
      return supabaseData;
    }

    const localById = new Map<string, Match>();
    const localByKey = new Map<string, Match>();
    for (const lm of localData.matches) {
      if (lm?.id) localById.set(lm.id, lm);
      if (lm?.home_team && lm?.away_team) localByKey.set(matchIdentityKey(lm), lm);
    }

    const seenKeys = new Set<string>();
    const mergedMatches = supabaseData.matches.map((sm) => {
      const sKey = matchIdentityKey(sm);
      seenKeys.add(sKey);

      const candidateById = sm.id ? localById.get(sm.id) : undefined;
      const lm =
        candidateById && isSameFixtureMatch(sm, candidateById)
          ? candidateById
          : localByKey.get(sKey);
      if (!lm) return sm;

      const supaHasScore =
        sm.status === "finished" ||
        (sm.home_score !== null && sm.home_score !== undefined && sm.away_score !== null && sm.away_score !== undefined);
      const localHasScore =
        lm.status === "finished" ||
        (lm.home_score !== null && lm.home_score !== undefined && lm.away_score !== null && lm.away_score !== undefined);

      if (!supaHasScore && localHasScore) {
        return {
          ...sm,
          score: lm.score,
          home_score: lm.home_score,
          away_score: lm.away_score,
          set_scores: lm.set_scores && lm.set_scores.length > 0 ? lm.set_scores : sm.set_scores,
          status: lm.status || "finished",
          forfeit: lm.forfeit ?? sm.forfeit,
          volleybox: lm.volleybox?.synced ? lm.volleybox : sm.volleybox,
        };
      }
      if ((!sm.set_scores || sm.set_scores.length === 0) && lm.set_scores && lm.set_scores.length > 0) {
        return {
          ...sm,
          set_scores: lm.set_scores,
          volleybox: lm.volleybox?.synced ? lm.volleybox : sm.volleybox,
        };
      }
      if (!sm.volleybox?.synced && lm.volleybox?.synced) {
        return {
          ...sm,
          volleybox: lm.volleybox,
        };
      }
      return sm;
    });

    for (const lm of localData.matches) {
      const lKey = matchIdentityKey(lm);
      if (lm?.id && !seenKeys.has(lKey)) {
        mergedMatches.push(lm);
      }
    }

    const latestUpdatedAt =
      localData.updated_at && (!supabaseData.updated_at || new Date(localData.updated_at) > new Date(supabaseData.updated_at))
        ? localData.updated_at
        : supabaseData.updated_at;

    return {
      ...supabaseData,
      updated_at: latestUpdatedAt,
      total_matches: mergedMatches.length,
      matches: mergedMatches,
    };
  } catch {
    return supabaseData;
  }
}
