/** Kulüp kökü çıkarımı ve kardeş takım (aynı kulübün diğer takımları) bulma. */
import { Match, StandingItem, VolleyboxMapping } from "@/types/fixture";
import { slugify } from "../slugify";
import { getVolleyboxMapping, normalizeCitySlug } from "../volleybox";
import type { ClubSisterTeam, StandingsCityEntry } from "./types";

export function extractClubRoot(name: string): { rootName: string; rootSlug: string; branch?: string; age?: string } {
  if (!name) return { rootName: "", rootSlug: "" };

  let cleaned = name.trim();
  let branch: string | undefined = undefined;
  let age: string | undefined = undefined;

  // 1. Yaş Grubu Tespiti: U18, U16, U14, U12, U10 vb.
  const uMatch = cleaned.match(/\bU\s*(1[0-9]|2[0-1])\b/i);
  if (uMatch) {
    age = `U${uMatch[1]}`;
    cleaned = cleaned.replace(/\bU\s*(1[0-9]|2[0-1])\b/gi, "").trim();
  } else if (/\bGenç(?:ler)?\b/i.test(cleaned)) {
    age = "U18 (Genç)";
    cleaned = cleaned.replace(/\bGenç(?:ler)?\b/gi, "").trim();
  } else if (/\bYıldız(?:lar)?\b/i.test(cleaned)) {
    age = "U16 (Yıldız)";
    cleaned = cleaned.replace(/\bYıldız(?:lar)?\b/gi, "").trim();
  } else if (/\bKüçük(?:ler)?\b/i.test(cleaned)) {
    age = "U14 (Küçük)";
    cleaned = cleaned.replace(/\bKüçük(?:ler)?\b/gi, "").trim();
  } else if (/\bMidi\b/i.test(cleaned)) {
    age = "U12 (Midi)";
    cleaned = cleaned.replace(/\bMidi\b/gi, "").trim();
  }

  // 2. Branş / Takım Harfi Tespiti: - A, - B, - C, A Takımı, B Takımı, sonundaki " A", " B" veya (B)
  const branchMatch = cleaned.match(/(?:[-–—\s]\s*|\()([A-D])(?:\)|\s*Takımı|\s*Takım|\s*$)/i);
  if (branchMatch) {
    branch = `${branchMatch[1].toUpperCase()} Takımı`;
    cleaned = cleaned.replace(/(?:[-–—\s]\s*|\()([A-D])(?:\)|\s*Takımı|\s*Takım|\s*$)/gi, "").trim();
  }

  // 3. Sondaki tire ve fazla boşlukları temizle
  cleaned = cleaned.replace(/[-–—\s]+$/, "").trim();

  const rootSlug = slugify(cleaned);
  return {
    rootName: cleaned,
    rootSlug,
    branch,
    age,
  };
}

interface SisterCandidate {
  teamName: string;
  city: string;
  category?: string;
  count: number;
  candMapping: VolleyboxMapping | undefined;
  candExt: ReturnType<typeof extractClubRoot>;
  candRoots: Set<string>;
}

const sisterCandidateCache = new WeakMap<
  Match[],
  { standings: object; candidates: SisterCandidate[] }
>();

function stripClubSuffix(slug: string): string {
  return slug.replace(/-sk$/, "").replace(/-spor-kulubu$/, "").replace(/-spor$/, "");
}

function getSisterCandidates(
  allMatches: Match[],
  standingsByCity: Record<string, StandingsCityEntry>
): SisterCandidate[] {
  const cached = sisterCandidateCache.get(allMatches);
  if (cached && cached.standings === standingsByCity) return cached.candidates;

  const candidatesMap = new Map<string, { teamName: string; city: string; category?: string; count: number }>();

  const addCandidate = (teamName: string, city: string, category?: string) => {
    if (!teamName) return;
    const key = `${teamName}__${city}`;
    const existing = candidatesMap.get(key) || { teamName, city, category, count: 0 };
    existing.count++;
    if (!existing.category && category) existing.category = category;
    candidatesMap.set(key, existing);
  };

  for (const m of allMatches) {
    const mCity = m.city || "İstanbul";
    addCandidate(m.home_team, mCity, m.category);
    addCandidate(m.away_team, mCity, m.category);
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const [groupName, groupData] of Object.entries(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData) ? groupData : groupData?.table || [];
      for (const item of table) {
        if (item.team) {
          addCandidate(item.team, cityName, groupName);
        }
      }
    }
  }

  const candidates: SisterCandidate[] = [];
  for (const cand of candidatesMap.values()) {
    const candMapping = getVolleyboxMapping(cand.teamName, cand.category, undefined, cand.city);
    const candExt = extractClubRoot(cand.teamName);

    const candRoots = new Set<string>();
    if (candExt.rootSlug) {
      candRoots.add(candExt.rootSlug);
      const candWithoutSk = stripClubSuffix(candExt.rootSlug);
      if (candWithoutSk) candRoots.add(candWithoutSk);
    }
    if (candMapping?.internal_name) {
      const islug = slugify(candMapping.internal_name);
      candRoots.add(islug);
      const islugWithoutSk = stripClubSuffix(islug);
      if (islugWithoutSk) candRoots.add(islugWithoutSk);
    }
    candidates.push({ ...cand, candMapping, candExt, candRoots });
  }

  sisterCandidateCache.set(allMatches, { standings: standingsByCity, candidates });
  return candidates;
}

export function findClubSisterTeams(
  officialTeamName: string,
  currentSlug: string,
  selectedCity: string,
  allMatches: Match[],
  standingsByCity: Record<string, StandingsCityEntry>,
  mapping?: VolleyboxMapping
): ClubSisterTeam[] {
  const currentExtraction = extractClubRoot(officialTeamName);
  const targetRoots = new Set<string>();

  // 1. Olası kulüp kök slug'larını topla
  if (currentExtraction.rootSlug) {
    targetRoots.add(currentExtraction.rootSlug);
    const withoutSk = currentExtraction.rootSlug
      .replace(/-sk$/, "")
      .replace(/-spor-kulubu$/, "")
      .replace(/-spor$/, "");
    if (withoutSk) targetRoots.add(withoutSk);
  }

  if (mapping?.internal_name) {
    const internalSlug = slugify(mapping.internal_name);
    targetRoots.add(internalSlug);
    const internalWithoutSk = internalSlug
      .replace(/-sk$/, "")
      .replace(/-spor-kulubu$/, "")
      .replace(/-spor$/, "");
    if (internalWithoutSk) targetRoots.add(internalWithoutSk);
  }

  if (targetRoots.size === 0) {
    return [];
  }

  // 2-3. Tüm maç ve puan tablolarındaki takımlar ve kök slug'ları (veri başına bir kez hesaplanıp önbelleğe alınır)
  const results: ClubSisterTeam[] = [];
  const addedSlugs = new Set<string>();

  for (const cand of getSisterCandidates(allMatches, standingsByCity)) {
    const { candMapping, candExt, candRoots } = cand;

    // Ortak kök var mı?
    let matchesRoot = false;
    for (const r of candRoots) {
      if (targetRoots.has(r)) {
        matchesRoot = true;
        break;
      }
    }

    if (matchesRoot) {
      const teamSlug = slugify(cand.teamName);
      const citySlug = normalizeCitySlug(cand.city);
      const uniqueKey = `${teamSlug}__${citySlug}`;

      if (addedSlugs.has(uniqueKey)) continue;
      addedSlugs.add(uniqueKey);

      const isCurrent =
        teamSlug === currentSlug ||
        cand.teamName.toLocaleLowerCase("tr-TR") === officialTeamName.toLocaleLowerCase("tr-TR");

      // Yaş kategorisi tespiti (takım adından veya kategoriden)
      let ageCat: string | undefined = candExt.age || candMapping?.age_category || undefined;
      if (!ageCat && cand.category) {
        if (/genç|u18/i.test(cand.category)) ageCat = "U18";
        else if (/yıldız|u16/i.test(cand.category)) ageCat = "U16";
        else if (/küçük|u14/i.test(cand.category)) ageCat = "U14";
        else if (/midi|u12/i.test(cand.category)) ageCat = "U12";
      }

      results.push({
        teamName: cand.teamName,
        slug: teamSlug,
        city: cand.city,
        citySlug,
        path: `/takim/${teamSlug}?sehir=${citySlug}`,
        ageCategory: ageCat || undefined,
        teamBranch: candExt.branch,
        leagueName: cand.category,
        isCurrent,
        matchesCount: cand.count,
      });
    }
  }

  // Şu anki takım listede yoksa ekle
  if (!results.some((r) => r.isCurrent)) {
    const curExt = extractClubRoot(officialTeamName);
    results.unshift({
      teamName: officialTeamName,
      slug: currentSlug,
      city: selectedCity,
      citySlug: normalizeCitySlug(selectedCity),
      path: `/takim/${currentSlug}?sehir=${normalizeCitySlug(selectedCity)}`,
      ageCategory: curExt.age || undefined,
      teamBranch: curExt.branch,
      isCurrent: true,
    });
  }

  // Sıralama:
  // 1) Aynı ildekiler önce
  // 2) U18, U16, U14 sırasıyla
  // 3) A takımı önce, sonra B, sonra C
  const ageOrder = (age?: string) => {
    if (!age) return 99;
    if (age.includes("18")) return 1;
    if (age.includes("16")) return 2;
    if (age.includes("14")) return 3;
    if (age.includes("12")) return 4;
    return 10;
  };

  const branchOrder = (br?: string) => {
    if (!br) return 1; // Ana takım
    if (br.includes("A")) return 2;
    if (br.includes("B")) return 3;
    if (br.includes("C")) return 4;
    return 5;
  };

  results.sort((a, b) => {
    // Aynı il öncelikli
    const aCitySame = a.city === selectedCity ? 0 : 1;
    const bCitySame = b.city === selectedCity ? 0 : 1;
    if (aCitySame !== bCitySame) return aCitySame - bCitySame;

    // Yaş grubu
    const aAge = ageOrder(a.ageCategory);
    const bAge = ageOrder(b.ageCategory);
    if (aAge !== bAge) return aAge - bAge;

    // Takım şubesi (A, B, C)
    const aBr = branchOrder(a.teamBranch);
    const bBr = branchOrder(b.teamBranch);
    if (aBr !== bBr) return aBr - bBr;

    return a.teamName.localeCompare(b.teamName, "tr-TR");
  });

  return results;
}
