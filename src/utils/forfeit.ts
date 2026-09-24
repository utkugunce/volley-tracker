/**
 * TVF ve Voleybol Kurallarına Göre Hükmen Maç Yardımcı Fonksiyonları
 * 
 * Türkiye Voleybol Federasyonu (TVF) ve FIVB kurallarına göre bir takım maça
 * çıkmadığında veya hükmen mağlup sayıldığında:
 * - Maç sonucu 3 - 0 veya 0 - 3 olarak tescil edilir.
 * - Set skorları 25-0, 25-0, 25-0 (veya deplasman galibiyetinde 0-25, 0-25, 0-25) yazılır.
 * - TVF bültenlerinde maça çıkmayan takımın adının başına/sonuna genellikle "(H)" eklenir.
 */

export interface MatchForfeitInfo {
  isForfeit: boolean;
  winner?: "home" | "away" | null;
  forfeitedBy?: "home" | "away" | null;
  label: string; // "Hükmen"
  reason?: string;
}

export function getMatchForfeitInfo(
  match?: {
    set_scores?: string[] | null;
    home_team?: string | null;
    away_team?: string | null;
    score?: string | null;
    status?: string | null;
    home_score?: number | null;
    away_score?: number | null;
  } | null
): MatchForfeitInfo {
  if (!match) {
    return { isForfeit: false, label: "" };
  }

  const rawSets = match.set_scores || [];
  const cleanSets = rawSets
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.replace(/\s+/g, ""));

  // 1. Kural: 3 setin tamamı 25-0 ise ev sahibi hükmen galip
  const is3ZeroHome = cleanSets.length === 3 && cleanSets.every((s) => s === "25-0");
  if (is3ZeroHome) {
    return {
      isForfeit: true,
      winner: "home",
      forfeitedBy: "away",
      label: "Hükmen",
      reason: "25-0, 25-0, 25-0 set skorları ile hükmen galibiyet",
    };
  }

  // 2. Kural: 3 setin tamamı 0-25 ise deplasman takımı hükmen galip
  const is3ZeroAway = cleanSets.length === 3 && cleanSets.every((s) => s === "0-25");
  if (is3ZeroAway) {
    return {
      isForfeit: true,
      winner: "away",
      forfeitedBy: "home",
      label: "Hükmen",
      reason: "0-25, 0-25, 0-25 set skorları ile hükmen galibiyet",
    };
  }

  // 3. Kural: Setler arasında en az 3 adet 25-0 veya 0-25 varsa
  const count25Zero = cleanSets.filter((s) => s === "25-0").length;
  const countZero25 = cleanSets.filter((s) => s === "0-25").length;
  if (count25Zero >= 3) {
    return {
      isForfeit: true,
      winner: "home",
      forfeitedBy: "away",
      label: "Hükmen",
      reason: "Hükmen galibiyet (25-0)",
    };
  }
  if (countZero25 >= 3) {
    return {
      isForfeit: true,
      winner: "away",
      forfeitedBy: "home",
      label: "Hükmen",
      reason: "Hükmen galibiyet (0-25)",
    };
  }

  // 4. Kural: Takım adında TVF resmi "(H)" veya "Hükmen" ibaresi bulunması
  const isHPattern = /(?:^|\s|\()(?:H|HÜKMEN|HUKMEN)(?:\)|\s|-|$)/i;
  const homeHasH = Boolean(match.home_team && isHPattern.test(match.home_team));
  const awayHasH = Boolean(match.away_team && isHPattern.test(match.away_team));

  if (homeHasH && (cleanSets.length > 0 || match.status === "finished" || (match.away_score ?? 0) > 0)) {
    return {
      isForfeit: true,
      winner: "away",
      forfeitedBy: "home",
      label: "Hükmen",
      reason: "Ev sahibi takım maça çıkmadı / hükmen mağlup",
    };
  }

  if (awayHasH && (cleanSets.length > 0 || match.status === "finished" || (match.home_score ?? 0) > 0)) {
    return {
      isForfeit: true,
      winner: "home",
      forfeitedBy: "away",
      label: "Hükmen",
      reason: "Deplasman takımı maça çıkmadı / hükmen mağlup",
    };
  }

  // 5. Kural: Skor metninde açıkça "hükmen" veya "(H)" belirtilmesi
  if (match.score && /(?:hükmen|hukmen|\(H\))/i.test(match.score)) {
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;
    return {
      isForfeit: true,
      winner: homeScore >= awayScore ? "home" : "away",
      forfeitedBy: homeScore >= awayScore ? "away" : "home",
      label: "Hükmen",
      reason: "Hükmen sonuçlandı",
    };
  }

  return { isForfeit: false, label: "" };
}

export function isForfeitMatch(
  match?: {
    set_scores?: string[] | null;
    home_team?: string | null;
    away_team?: string | null;
    score?: string | null;
    status?: string | null;
    home_score?: number | null;
    away_score?: number | null;
  } | null
): boolean {
  return getMatchForfeitInfo(match).isForfeit;
}
