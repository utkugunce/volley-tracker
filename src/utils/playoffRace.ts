/**
 * Play-off (ilk N) için matematiksel durum hesabı. Olasılık/tahmin YOKTUR; yalnızca kesin durum:
 *
 *  - Garanti: Kalan maçlar nasıl biterse bitsin takım ilk N içinde kalır.
 *  - Elenmiş: Kalan maçlar nasıl biterse bitsin takım ilk N'e giremez.
 *  - Açık: Her iki sonuç da hâlâ mümkün.
 *
 * Kural (puan eşitliğinde averaj/ikili sonuçlar bilinmediği için eşitlik rakip lehine sayılır):
 *  - Bir maçta en fazla 3, en az 0 puan alınır.
 *  - En yüksek puan = mevcut puan + 3 × kalan maç. En düşük puan = mevcut puan.
 *  - "Garanti": en yüksek puanı benim mevcut puanıma eşit veya daha yüksek olabilen rakip sayısı ≤ N − 1.
 *  - "Elenmiş": şimdiden benim en yüksek puanımdan KESİN fazla puanı olan rakip sayısı ≥ N.
 *
 * Hesap yalnızca grubun fikstürü tamamsa yapılır (bkz. analyzeSchedule); aksi hâlde kalan maç sayısı
 * bilinemediği için durum "Belirsiz" olarak bırakılır.
 */

export type PlayoffStatus = "qualified" | "eliminated" | "open" | "unknown";

export interface RaceInputRow {
  team: string;
  played: number;
  points: number;
}

export interface RaceTeamResult {
  team: string;
  played: number;
  points: number;
  remaining: number;
  maxPoints: number;
  status: PlayoffStatus;
}

export const MAX_POINTS_PER_MATCH = 3;

export function evaluatePlayoffRace(
  rows: RaceInputRow[],
  remainingByTeam: Map<string, number>,
  cutoff = 4,
  scheduleComplete = true
): RaceTeamResult[] {
  const base = rows.map((r) => {
    const remaining = remainingByTeam.get(r.team) ?? 0;
    return {
      team: r.team,
      played: r.played,
      points: r.points,
      remaining,
      maxPoints: r.points + remaining * MAX_POINTS_PER_MATCH,
    };
  });

  return base.map((t) => {
    if (!scheduleComplete || rows.length <= cutoff) {
      return { ...t, status: "unknown" as const };
    }
    const mightBeAhead = base.filter((u) => u.team !== t.team && u.maxPoints >= t.points).length;
    const surelyAhead = base.filter((u) => u.team !== t.team && u.points > t.maxPoints).length;
    const status: PlayoffStatus =
      mightBeAhead <= cutoff - 1 ? "qualified" : surelyAhead >= cutoff ? "eliminated" : "open";
    return { ...t, status };
  });
}

export interface ScheduleMatch {
  home: string;
  away: string;
  status: string;
}

export interface ScheduleAnalysis {
  /** Fikstür, her takım çiftinin aynı sayıda karşılaştığı tam bir lig düzeni mi? */
  complete: boolean;
  /** Tam ise çift başına karşılaşma sayısı (1 = tek devre, 2 = çift devre). */
  meetingsPerPair: number | null;
  /** Takım başına kalan (oynanmamış/ertelenmiş/canlı) maç sayısı. */
  remaining: Map<string, number>;
  reason?: "no_teams" | "played_mismatch" | "uneven_pairs" | "unknown_team";
}

/**
 * Grubun fikstürünün "tam" olup olmadığını denetler. Tam sayılması için:
 *  1. Her takımın puan durumundaki oynanan maç sayısı, bilinen biten maçlarıyla aynı olmalı,
 *  2. Her takım çifti (n×(n−1)/2) bilinen maçlarda aynı sayıda (k ≥ 1) karşılaşmalı,
 *  3. Maçlardaki tüm takımlar puan durumunda yer almalı.
 * Fikstür kısmen açıklandıysa bu koşullar sağlanmaz ve kesin durum hesaplanmaz.
 */
export function analyzeSchedule(
  teams: Array<{ team: string; played: number }>,
  matches: ScheduleMatch[]
): ScheduleAnalysis {
  const remaining = new Map<string, number>(teams.map((t) => [t.team, 0]));
  const finished = new Map<string, number>(teams.map((t) => [t.team, 0]));
  const pairCounts = new Map<string, number>();
  const known = new Set(teams.map((t) => t.team));

  if (teams.length < 2) return { complete: false, meetingsPerPair: null, remaining, reason: "no_teams" };

  let unknownTeam = false;
  for (const m of matches) {
    if (!known.has(m.home) || !known.has(m.away) || m.home === m.away) {
      unknownTeam = true;
      continue;
    }
    const key = m.home < m.away ? `${m.home}\u0000${m.away}` : `${m.away}\u0000${m.home}`;
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    if (m.status === "finished") {
      finished.set(m.home, (finished.get(m.home) ?? 0) + 1);
      finished.set(m.away, (finished.get(m.away) ?? 0) + 1);
    } else {
      remaining.set(m.home, (remaining.get(m.home) ?? 0) + 1);
      remaining.set(m.away, (remaining.get(m.away) ?? 0) + 1);
    }
  }

  if (unknownTeam) return { complete: false, meetingsPerPair: null, remaining, reason: "unknown_team" };

  for (const t of teams) {
    if ((finished.get(t.team) ?? 0) !== t.played) {
      return { complete: false, meetingsPerPair: null, remaining, reason: "played_mismatch" };
    }
  }

  const pairTotal = (teams.length * (teams.length - 1)) / 2;
  const counts = Array.from(pairCounts.values());
  const k = counts[0] ?? 0;
  if (counts.length !== pairTotal || k < 1 || counts.some((c) => c !== k)) {
    return { complete: false, meetingsPerPair: null, remaining, reason: "uneven_pairs" };
  }

  return { complete: true, meetingsPerPair: k, remaining };
}

export const PLAYOFF_STATUS_LABEL: Record<PlayoffStatus, string> = {
  qualified: "Garanti",
  eliminated: "Elenmiş",
  open: "Açık",
  unknown: "Belirsiz",
};
