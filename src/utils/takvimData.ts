import { displayName, type SultanlarMatch } from "@/utils/sultanlarIcs";
import type { CalendarMatch } from "@/utils/takvim";

/** TVF maçını istemciye gönderilecek serileştirilebilir takvim kaydına çevirir (görüntü adları hazır). */
export function toCalendarMatch(m: SultanlarMatch): CalendarMatch {
  return {
    id: `${m.season}-${m.matchNo}`,
    date: m.date,
    time: m.time,
    week: m.week,
    home: displayName(m.homeTeam),
    away: displayName(m.awayTeam),
    venue: displayName(m.venue),
    city: displayName(m.city),
    broadcaster: m.broadcaster,
    homeSets: m.homeSets,
    awaySets: m.awaySets,
    setScores: m.setScores,
  };
}
