import { getVolleyballPoints } from "./teamStats";
import { getMatchForfeitInfo } from "./forfeit";
import { compareMatchDateTime } from "./calendar";

/**
 * Takım performans istatistikleri için saf (yan etkisiz) hesaplamalar.
 * Yalnızca eldeki maç verisinden türetilir; veri yoksa ilgili alan `null` döner ve arayüz bölümü gizler.
 * `fs` kullanmaz, bu yüzden istemci bileşenlerinden de güvenle içe aktarılabilir.
 */

/** Bir takımın bakış açısından maç girdisi. `TeamMatchDetail` bu tipi yapısal olarak karşılar. */
export interface StatsMatchInput {
  id: string;
  date: string;
  time?: string | null;
  status: "upcoming" | "finished" | "postponed" | "live" | string;
  /** Takım ev sahibi mi? */
  isHome: boolean;
  opponent?: string;
  /** Takımın aldığı set sayısı (takım bakış açısı). */
  teamScore?: number | null;
  /** Rakibin aldığı set sayısı. */
  opponentScore?: number | null;
  /** Ham set skorları: HER ZAMAN ev sahibi-deplasman sırasıyla ("25-10"). */
  set_scores?: string[] | null;
  score?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  home_score?: number | null;
  away_score?: number | null;
}

/** "25-10", "(25-10) (20-25)" gibi ham metinlerden set skor çiftlerini çıkarır (ev-deplasman sırasıyla). */
export function parseSetScores(raw?: string[] | null): Array<[number, number]> {
  if (!raw || raw.length === 0) return [];
  const out: Array<[number, number]> = [];
  const re = /(\d{1,3})\s*[-:]\s*(\d{1,3})/g;
  for (const item of raw) {
    if (typeof item !== "string") continue;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(item)) !== null) {
      out.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
    }
  }
  return out;
}

export interface RecordSplit {
  played: number;
  wins: number;
  losses: number;
}

export interface PointsSummary {
  /** Set skoru verisi güvenilir olan maç sayısı. */
  matches: number;
  sets: number;
  pointsFor: number;
  pointsAgainst: number;
  avgForPerSet: number;
  avgAgainstPerSet: number;
  avgForPerMatch: number;
  avgAgainstPerMatch: number;
}

export interface TeamStatsSummary {
  played: number;
  wins: number;
  losses: number;
  /** 0–1 arası; maç yoksa null. */
  winRate: number | null;
  setsFor: number;
  setsAgainst: number;
  /** Alınan / verilen set; verilen set 0 ise null (sonsuz). */
  setRatio: number | null;
  avgSetsForPerMatch: number | null;
  avgSetsAgainstPerMatch: number | null;
  /** Set farkına göre toplanan lig puanı (bkz. getVolleyballPoints). */
  leaguePoints: number;
  avgLeaguePoints: number | null;
  /** Sayı ortalamaları; hiçbir maçta güvenilir set skoru yoksa null. Hükmen maçlar hariç. */
  points: PointsSummary | null;
  /** Güncel seri (en son biten maçtan geriye). */
  streak: { type: "W" | "L"; length: number } | null;
  longestWinStreak: number;
  longestLossStreak: number;
  home: RecordSplit | null;
  away: RecordSplit | null;
  /** 3-0 / 3-1 / 3-2 galibiyet sayıları. */
  winBreakdown: { "3-0": number; "3-1": number; "3-2": number };
  /** 2-3 / 1-3 / 0-3 mağlubiyet sayıları. */
  lossBreakdown: { "2-3": number; "1-3": number; "0-3": number };
  /** 3 setlik standart biçime uymayan sonuçlar (örn. 2-0). */
  otherResults: number;
  forfeits: number;
}

interface DecidedMatch {
  m: StatsMatchInput;
  teamSets: number;
  oppSets: number;
  win: boolean;
}

/** Tarih "gg.aa.yyyy" gelirse ISO'ya çevirir; sıralama için kullanılır. */
function sortableDate(d?: string | null): string {
  const s = (d || "").trim();
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

/** Biten ve sonucu belli maçları kronolojik (eskiden yeniye) sırayla döndürür. */
export function getDecidedMatches(matches: StatsMatchInput[]): DecidedMatch[] {
  const decided: DecidedMatch[] = [];
  for (const m of matches) {
    if (m.status !== "finished") continue;
    if (typeof m.teamScore !== "number" || typeof m.opponentScore !== "number") continue;
    if (m.teamScore === m.opponentScore) continue;
    decided.push({ m, teamSets: m.teamScore, oppSets: m.opponentScore, win: m.teamScore > m.opponentScore });
  }
  return decided
    .map((d, i) => ({ d, i }))
    .sort(
      (a, b) =>
        compareMatchDateTime(
          { date: sortableDate(a.d.m.date), time: a.d.m.time },
          { date: sortableDate(b.d.m.date), time: b.d.m.time }
        ) || a.i - b.i
    )
    .map((x) => x.d);
}

/** Galibiyet serisi hesabı: kronolojik W/L dizisinden güncel seri ve en uzun seriler. */
export function computeStreaks(results: boolean[]): {
  current: { type: "W" | "L"; length: number } | null;
  longestWin: number;
  longestLoss: number;
} {
  let longestWin = 0;
  let longestLoss = 0;
  let run = 0;
  let prev: boolean | null = null;
  for (const win of results) {
    run = prev === win ? run + 1 : 1;
    prev = win;
    if (win) longestWin = Math.max(longestWin, run);
    else longestLoss = Math.max(longestLoss, run);
  }
  const current = prev === null ? null : { type: (prev ? "W" : "L") as "W" | "L", length: run };
  return { current, longestWin, longestLoss };
}

const round = (n: number, digits = 1) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

export function computeTeamStats(matches: StatsMatchInput[]): TeamStatsSummary {
  const decided = getDecidedMatches(matches);

  let wins = 0;
  let losses = 0;
  let setsFor = 0;
  let setsAgainst = 0;
  let leaguePoints = 0;
  let forfeits = 0;
  let otherResults = 0;
  const home: RecordSplit = { played: 0, wins: 0, losses: 0 };
  const away: RecordSplit = { played: 0, wins: 0, losses: 0 };
  const winBreakdown = { "3-0": 0, "3-1": 0, "3-2": 0 };
  const lossBreakdown = { "2-3": 0, "1-3": 0, "0-3": 0 };

  let ptMatches = 0;
  let ptSets = 0;
  let ptFor = 0;
  let ptAgainst = 0;

  for (const { m, teamSets, oppSets, win } of decided) {
    if (win) wins++;
    else losses++;
    setsFor += teamSets;
    setsAgainst += oppSets;
    leaguePoints += getVolleyballPoints(teamSets, oppSets);

    const split = m.isHome ? home : away;
    split.played++;
    if (win) split.wins++;
    else split.losses++;

    const key = `${teamSets}-${oppSets}`;
    if (win && key in winBreakdown) winBreakdown[key as keyof typeof winBreakdown]++;
    else if (!win && key in lossBreakdown) lossBreakdown[key as keyof typeof lossBreakdown]++;
    else otherResults++;

    const forfeit = getMatchForfeitInfo({
      set_scores: m.set_scores,
      home_team: m.home_team,
      away_team: m.away_team,
      score: m.score,
      status: m.status,
      home_score: m.home_score,
      away_score: m.away_score,
    }).isForfeit;
    if (forfeit) {
      forfeits++;
      continue; // Hükmen set skorları (25-0) gerçek sayı verisi değildir.
    }

    // Set skorları ev-deplasman sırasıyla gelir; takım bakış açısına çevrilir.
    // Set sayısı skorla uyuşmuyorsa veri güvenilir sayılmaz ve bu maç sayı istatistiğine katılmaz.
    const sets = parseSetScores(m.set_scores);
    if (sets.length === 0 || sets.length !== teamSets + oppSets) continue;
    let f = 0;
    let a = 0;
    for (const [h, aw] of sets) {
      f += m.isHome ? h : aw;
      a += m.isHome ? aw : h;
    }
    ptMatches++;
    ptSets += sets.length;
    ptFor += f;
    ptAgainst += a;
  }

  const played = wins + losses;
  const streaks = computeStreaks(decided.map((d) => d.win));

  return {
    played,
    wins,
    losses,
    winRate: played > 0 ? wins / played : null,
    setsFor,
    setsAgainst,
    setRatio: setsAgainst > 0 ? round(setsFor / setsAgainst, 3) : null,
    avgSetsForPerMatch: played > 0 ? round(setsFor / played, 2) : null,
    avgSetsAgainstPerMatch: played > 0 ? round(setsAgainst / played, 2) : null,
    leaguePoints,
    avgLeaguePoints: played > 0 ? round(leaguePoints / played, 2) : null,
    points:
      ptMatches > 0
        ? {
            matches: ptMatches,
            sets: ptSets,
            pointsFor: ptFor,
            pointsAgainst: ptAgainst,
            avgForPerSet: round(ptFor / ptSets, 1),
            avgAgainstPerSet: round(ptAgainst / ptSets, 1),
            avgForPerMatch: round(ptFor / ptMatches, 1),
            avgAgainstPerMatch: round(ptAgainst / ptMatches, 1),
          }
        : null,
    streak: streaks.current,
    longestWinStreak: streaks.longestWin,
    longestLossStreak: streaks.longestLoss,
    home: home.played > 0 ? home : null,
    away: away.played > 0 ? away : null,
    winBreakdown,
    lossBreakdown,
    otherResults,
    forfeits,
  };
}

/** Son `limit` biten maçın puanına göre form (lig puanı toplamı). Minimum maç sayısı `minMatches`. */
export interface RecentForm {
  results: Array<"W" | "L">;
  matches: number;
  wins: number;
  points: number;
  maxPoints: number;
}

export function computeRecentForm(matches: StatsMatchInput[], limit = 5): RecentForm {
  const last = getDecidedMatches(matches).slice(-limit);
  let points = 0;
  let wins = 0;
  for (const d of last) {
    points += getVolleyballPoints(d.teamSets, d.oppSets);
    if (d.win) wins++;
  }
  return {
    results: last.map((d) => (d.win ? "W" : "L")),
    matches: last.length,
    wins,
    points,
    maxPoints: last.length * 3,
  };
}
