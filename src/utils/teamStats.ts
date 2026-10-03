import type { TeamMatchDetail } from "./teamData";
import { slugify } from "./slugify";
import { getHallDetails, getHallNavigationUrl, type HallInfo } from "./halls";

/**
 * Takım sayfası için saf (yan etkisiz) istatistik yardımcıları.
 * `teamData.ts` sunucuya özgü `fs` kullandığından burada yalnızca tip olarak içe aktarılır;
 * böylece bu dosya istemci bileşenlerinden de güvenle kullanılabilir.
 */

/**
 * Voleybol lig puanı (set farkına göre):
 * fark ≥ 2 galibiyet (3-0, 3-1, 2-0) = 3 puan, tek set farkı galibiyet (3-2, 2-1) = 2 puan,
 * tek set farkı mağlubiyet (2-3, 1-2) = 1 puan, diğer mağlubiyetler = 0 puan.
 */
export function getVolleyballPoints(teamSets: number, opponentSets: number): number {
  const diff = teamSets - opponentSets;
  if (diff >= 2) return 3;
  if (diff === 1) return 2;
  if (diff === -1) return 1;
  return 0;
}

export interface FormPoint {
  id: string;
  date: string;
  opponent: string;
  result: "W" | "L";
  score: string;
  /** 0–3 arası maç puanı (bkz. getVolleyballPoints). Set skoru bilinmiyorsa galibiyet 3, mağlubiyet 0 sayılır. */
  points: number;
}

function hasScore(m: TeamMatchDetail): boolean {
  return typeof m.teamScore === "number" && typeof m.opponentScore === "number";
}

/**
 * Tamamlanmış maçlardan (kronolojik sırada verilmiş olmalı) son `limit` maçlık form serisini üretir.
 * Skoru olmayan / sonucu belirsiz maçlar atlanır.
 */
export function buildFormSeries(matches: TeamMatchDetail[], limit = 10): FormPoint[] {
  const decided = matches.filter(
    (m) => m.status === "finished" && (m.result === "win" || m.result === "loss")
  );
  return decided.slice(-limit).map((m) => {
    const known = hasScore(m);
    const points = known
      ? getVolleyballPoints(m.teamScore as number, m.opponentScore as number)
      : m.result === "win"
        ? 3
        : 0;
    return {
      id: m.id,
      date: m.date,
      opponent: m.opponent,
      result: m.result === "win" ? "W" : "L",
      score: known ? `${m.teamScore} - ${m.opponentScore}` : m.score || "-",
      points,
    };
  });
}

export interface OpponentMeeting {
  id: string;
  date: string;
  isHome: boolean;
  result: "W" | "L";
  score: string;
  category?: string;
}

export interface OpponentRecord {
  /** Rakibin görünen adı (ilk karşılaşmadaki yazım). */
  opponent: string;
  slug: string;
  played: number;
  wins: number;
  losses: number;
  upcoming: number;
  setsFor: number;
  setsAgainst: number;
  meetings: OpponentMeeting[];
}

/**
 * Rakip bazında geçmiş sonuç özeti (head-to-head). Yalnızca en az bir kez oynanmış rakipler döner;
 * en çok karşılaşılan rakip önce gelir, eşitlikte ada göre (Türkçe) sıralanır.
 * `meetings` kronolojik (eskiden yeniye) sıradadır.
 */
export function computeOpponentRecords(matches: TeamMatchDetail[]): OpponentRecord[] {
  const byOpponent = new Map<string, OpponentRecord>();

  for (const m of matches) {
    const name = (m.opponent || "").trim();
    const slug = slugify(name);
    if (!slug) continue;

    let rec = byOpponent.get(slug);
    if (!rec) {
      rec = {
        opponent: name,
        slug,
        played: 0,
        wins: 0,
        losses: 0,
        upcoming: 0,
        setsFor: 0,
        setsAgainst: 0,
        meetings: [],
      };
      byOpponent.set(slug, rec);
    }

    if (m.status !== "finished") {
      if (m.status !== "postponed") rec.upcoming += 1;
      continue;
    }
    if (m.result !== "win" && m.result !== "loss") continue;

    rec.played += 1;
    if (m.result === "win") rec.wins += 1;
    else rec.losses += 1;

    if (hasScore(m)) {
      rec.setsFor += m.teamScore as number;
      rec.setsAgainst += m.opponentScore as number;
    }
    rec.meetings.push({
      id: m.id,
      date: m.date,
      isHome: m.isHome,
      result: m.result === "win" ? "W" : "L",
      score: hasScore(m) ? `${m.teamScore} - ${m.opponentScore}` : m.score || "-",
      category: m.category,
    });
  }

  return Array.from(byOpponent.values())
    .filter((r) => r.played > 0)
    .sort((a, b) => b.played - a.played || a.opponent.localeCompare(b.opponent, "tr-TR"));
}

export interface TeamHall {
  name: string;
  matchCount: number;
  city?: string;
  navigationUrl: string;
  details: HallInfo | null;
}

const EMPTY_HALLS = new Set(["", "tbd", "-", "belirtilmemis", "belirtilmemiş"]);

/**
 * Takımın maçlarında geçen salonları, kullanım sıklığına göre (en çok kullanılan önce) döndürür.
 * Salon bilgisi olmayan maçlar yok sayılır; hiç salon yoksa boş dizi döner (bölüm gizlenir).
 */
export function getTeamHalls(matches: TeamMatchDetail[], limit = 3): TeamHall[] {
  const counts = new Map<string, { name: string; count: number; cities: Map<string, number> }>();

  for (const m of matches) {
    const name = (m.hall || "").trim();
    if (EMPTY_HALLS.has(name.toLocaleLowerCase("tr-TR"))) continue;
    const key = slugify(name);
    if (!key) continue;
    const entry = counts.get(key) ?? { name, count: 0, cities: new Map<string, number>() };
    entry.count += 1;
    if (m.city) entry.cities.set(m.city, (entry.cities.get(m.city) ?? 0) + 1);
    counts.set(key, entry);
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr-TR"))
    .slice(0, limit)
    .map((e) => {
      const city = Array.from(e.cities.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        name: e.name,
        matchCount: e.count,
        city,
        navigationUrl: getHallNavigationUrl(e.name, city),
        details: getHallDetails(e.name),
      };
    });
}
