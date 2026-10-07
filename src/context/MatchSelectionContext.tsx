"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Match } from "@/types/fixture";
import { replaceUrlIfChanged } from "@/utils/historyUrl";

export const isMatchScored = (m: Match): boolean => {
  if (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) return true;
  if (m.score && m.score.trim() !== "" && m.score.trim() !== "- : -" && m.score.toLowerCase() !== "vs") return true;
  if (m.volleybox?.has_score && m.volleybox?.score) return true;
  return false;
};

/**
 * Sayfa ilk açıldığında varsayılan maçı seçme kuralı:
 * 1. URL'de (?match=id) belirtilmiş geçerli bir maç varsa o seçilir.
 * 2. Varsa o günün/listenin ilk CANLI maçı seçilir.
 * 3. Yoksa ilk BİTEN (skorlu/tamamlanan) maçı seçilir.
 * 4. Hiçbiri yoksa ilk maç seçilir.
 */
export const findDefaultSelectedMatch = (
  matches: Match[],
  preferredMatchId?: string | null
): Match | null => {
  if (!matches || matches.length === 0) return null;

  if (preferredMatchId) {
    const found = matches.find((m) => m.id === preferredMatchId || m.match_no === preferredMatchId);
    if (found) return found;
  }

  // 1. Canlı maç ara
  const liveMatch = matches.find((m) => m.status === "live");
  if (liveMatch) return liveMatch;

  // 2. İlk biten / skorlu maç ara
  const finishedMatch = matches.find((m) => m.status === "finished" || isMatchScored(m));
  if (finishedMatch) return finishedMatch;

  // 3. Fallback: İlk maç
  return matches[0] || null;
};

interface MatchSelectionContextType {
  selectedMatchId: string | null;
  selectedMatch: Match | null;
  setSelectedMatchId: (id: string | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  allMatches: Match[];
}

const MatchSelectionContext = createContext<MatchSelectionContextType | undefined>(undefined);

interface MatchSelectionProviderProps {
  children: React.ReactNode;
  matches: Match[];
  initialMatchId?: string | null;
}

export const MatchSelectionProvider: React.FC<MatchSelectionProviderProps> = ({
  children,
  matches,
  initialMatchId = null,
}) => {
  const [selectedMatchId, setSelectedMatchIdState] = useState<string | null>(initialMatchId);

  // URL'den (?match=id) ilk id'yi oku
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMatchId = params.get("match");
      if (urlMatchId) {
        setSelectedMatchIdState(urlMatchId);
      }
    } catch {
      // URLSearchParams parse fallback
    }
  }, []);

  // Maç listesi yüklendiğinde veya değiştiğinde varsayılan maçı seç (eğer henüz seçili yoksa)
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    if (!selectedMatchId) {
      const defaultMatch = findDefaultSelectedMatch(matches);
      if (defaultMatch) {
        setSelectedMatchIdState(defaultMatch.id);
      }
    } else {
      // Seçili ID listede var mı kontrol et, yoksa varsayılana dön
      const exists = matches.some((m) => m.id === selectedMatchId || m.match_no === selectedMatchId);
      if (!exists) {
        const defaultMatch = findDefaultSelectedMatch(matches);
        if (defaultMatch) {
          setSelectedMatchIdState(defaultMatch.id);
        }
      }
    }
  }, [matches, selectedMatchId]);

  const setSelectedMatchId = useCallback((id: string | null) => {
    setSelectedMatchIdState(id);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (id) {
          url.searchParams.set("match", id);
        } else {
          url.searchParams.delete("match");
        }
        replaceUrlIfChanged(url);
      } catch {
        // history API fallback
      }
    }
  }, []);

  const setSelectedMatch = useCallback((match: Match | null) => {
    setSelectedMatchId(match ? match.id : null);
  }, [setSelectedMatchId]);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId || !matches) return null;
    return matches.find((m) => m.id === selectedMatchId || m.match_no === selectedMatchId) || null;
  }, [selectedMatchId, matches]);

  const value = useMemo(
    () => ({
      selectedMatchId,
      selectedMatch,
      setSelectedMatchId,
      setSelectedMatch,
      allMatches: matches,
    }),
    [selectedMatchId, selectedMatch, setSelectedMatchId, setSelectedMatch, matches]
  );

  return (
    <MatchSelectionContext.Provider value={value}>
      {children}
    </MatchSelectionContext.Provider>
  );
};

export const useMatchSelection = (): MatchSelectionContextType => {
  const context = useContext(MatchSelectionContext);
  if (!context) {
    throw new Error("useMatchSelection must be used within a MatchSelectionProvider");
  }
  return context;
};
