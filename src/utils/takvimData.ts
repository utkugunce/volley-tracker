import { displayName, type SultanlarMatch } from "@/utils/sultanlarIcs";
import type { CalendarMatch } from "@/utils/takvim";
import { sultanlarMatchToUnified } from "@/utils/unifiedAdapters";
import type { UnifiedFixture } from "@/types/unified";

/** TVF maçını istemciye gönderilecek serileştirilebilir takvim kaydına çevirir (görüntü adları hazır). */
export function toCalendarMatch(m: SultanlarMatch): CalendarMatch {
  const unified: UnifiedFixture = sultanlarMatchToUnified(m);
  return {
    id: `${m.season}-${m.matchNo}`,
    date: unified.date,
    time: unified.time,
    week: m.week,
    home: displayName(unified.home_team),
    away: displayName(unified.away_team),
    venue: displayName(unified.hall || m.venue),
    city: displayName(unified.city || m.city),
    broadcaster: m.broadcaster,
    homeSets: unified.home_score ?? m.homeSets,
    awaySets: unified.away_score ?? m.awaySets,
    setScores: m.setScores,
  };
}
