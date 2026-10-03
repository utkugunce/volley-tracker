import type { ComponentType } from "react";
import { Globe, MapPin } from "lucide-react";
import type { CityInfo, Match } from "@/types/fixture";
import { compareMatchTimes, isMatchOverdueForScore } from "@/utils/calendar";
import { isMatchScored } from "@/utils/matchScoring";

/** Tablo modunda bir lig / grup bölümü. */
export interface MatchSection {
  title: string;
  subTitle: string;
  matches: Match[];
}

export interface DashboardKpis {
  totalMatchesCount: number;
  activeCities: number;
  todayTotal: number;
  todayUpcoming: number;
  todayFinished: number;
  syncedCount: number;
  syncedPercent: number;
  scoredCount: number;
  unscoredPassed: number;
}

export interface MatchDay {
  date: string;
  matches: Match[];
}

export interface ActiveCityCard {
  slug: string;
  name: string;
  count: number;
  icon: ComponentType<{ size?: number; className?: string }>;
}

/** Dashboard KPI sayıları. */
export function computeDashboardKpis(matches: Match[], todayMatches: Match[], todayStr: string): DashboardKpis {
  const validMatches = matches.filter((m) => m.date && m.date !== "TBD");
  const totalMatchesCount = validMatches.length;

  const todayTotal = todayMatches.length;
  const todayUpcoming = todayMatches.filter((m) => m.status === "upcoming" || !isMatchScored(m)).length;
  const todayFinished = todayMatches.filter((m) => isMatchScored(m)).length;

  const syncedMatches = validMatches.filter((m) => m.volleybox?.synced);
  const syncedCount = syncedMatches.length;
  const syncedPercent =
    totalMatchesCount > 0 ? Math.round((syncedCount / totalMatchesCount) * 100) : 0;

  const scoredCount = syncedMatches.filter((m) => m.volleybox?.has_score).length;
  // O gün olan maçlar skorsuz gösterilmez, sadece dünden kalan skorsuzlar sayılır
  const unscoredPassed = syncedMatches.filter(
    (m) => !m.volleybox?.has_score && isMatchOverdueForScore(m.volleybox?.vb_date || m.date, todayStr)
  ).length;

  // Aktif il sayısı
  const activeCities = new Set(validMatches.map((m) => m.city).filter(Boolean)).size;

  return {
    totalMatchesCount,
    activeCities: activeCities,
    todayTotal,
    todayUpcoming,
    todayFinished,
    syncedCount,
    syncedPercent,
    scoredCount,
    unscoredPassed,
  };
}

/** Bugün maç yoksa: sıradaki en yakın maç günü ve maçları. */
export function findNextMatchDay(matches: Match[], todayMatchesCount: number, todayStr: string): MatchDay | null {
  if (todayMatchesCount > 0) return null;

  const futureDates = Array.from(
    new Set(
      matches
        .filter((m) => m.date && m.date !== "TBD" && m.date > todayStr)
        .map((m) => m.date)
    )
  ).sort();

  if (futureDates.length === 0) {
    const allDates = Array.from(
      new Set(matches.filter((m) => m.date && m.date !== "TBD").map((m) => m.date))
    ).sort();
    if (allDates.length > 0) {
      const d = allDates[0];
      return {
        date: d,
        matches: matches.filter((m) => m.date === d),
      };
    }
    return null;
  }

  const nextDate = futureDates[0];
  return {
    date: nextDate,
    matches: matches.filter((m) => m.date === nextDate),
  };
}

/** Bugün maç yoksa: en son tamamlanmış maç günü (Son Skorlar). */
export function findRecentFinishedDay(matches: Match[], todayMatchesCount: number, todayStr: string): MatchDay | null {
  if (todayMatchesCount > 0) return null;

  const pastDates = Array.from(
    new Set(
      matches
        .filter((m) => m.date && m.date !== "TBD" && m.date < todayStr && m.status === "finished")
        .map((m) => m.date)
    )
  )
    .sort()
    .reverse();

  if (pastDates.length === 0) return null;

  const lastDate = pastDates[0];
  return {
    date: lastDate,
    matches: matches.filter((m) => m.date === lastDate && m.status === "finished"),
  };
}

/** Maçları il / kategori / grup bölümlerine ayırır (Tablo modu için); bölümler başlığa göre, maçlar saate göre sıralanır. */
export function groupMatchesIntoSections(matches: Match[], city: string): MatchSection[] {
  const sections: {
    [key: string]: MatchSection;
  } = {};

  matches.forEach((m) => {
    const prefix = city === "Tüm İller" && m.city ? `${m.city} • ` : "";
    const groupKey = `${prefix}${m.category} - ${m.group}`;
    if (!sections[groupKey]) {
      sections[groupKey] = {
        title: `${prefix}${m.category}`,
        subTitle: m.group,
        matches: [],
      };
    }
    sections[groupKey].matches.push(m);
  });

  // Her bölümün maçlarını saat sırasına göre diz (Erken saat ilk)
  Object.values(sections).forEach((sec) => {
    sec.matches.sort((m1, m2) => compareMatchTimes(m1.time, m2.time));
  });

  return Object.values(sections).sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", "tr")
  );
}

/** Aktif iller listesi (Hızlı Dashboard Kartları için). */
export function buildActiveCityCards(citiesList: CityInfo[] | undefined, totalMatchesCount: number): ActiveCityCard[] {
  if (!citiesList || citiesList.length === 0) {
    return [];
  }

  const cards: ActiveCityCard[] = [
    { slug: "all", name: "Tüm İller", count: totalMatchesCount, icon: Globe },
  ];

  const active = citiesList.filter((c) => (c.matches_count || 0) > 0);
  active.sort((a, b) => (b.matches_count || 0) - (a.matches_count || 0));

  for (const c of active) {
    cards.push({
      slug: c.slug,
      name: c.name,
      count: c.matches_count || 0,
      icon: MapPin,
    });
  }

  return cards;
}

/** Skorbord metni: önce sayısal skor, yoksa "3-1" biçimli skor metninin ilgili tarafı, yoksa "-". */
export function getScoreText(m: Match, side: "home" | "away"): string {
  const score = side === "home" ? m.home_score : m.away_score;
  const idx = side === "home" ? 0 : 1;
  return score !== null && score !== undefined
    ? String(score)
    : m.score && m.score.includes("-")
    ? m.score.split("-")[idx]?.trim() || "-"
    : "-";
}
