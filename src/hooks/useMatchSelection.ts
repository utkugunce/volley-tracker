import { useState, useEffect, useCallback } from "react";
import type { Match } from "@/types/fixture";
import { findDefaultSelectedMatch } from "@/context/MatchSelectionContext";
import { replaceUrlIfChanged } from "@/utils/historyUrl";

/** Seçili maç, mobil çekmece durumu ve URL ?match=id senkronizasyonu. */
export function useMatchSelection(matches: Match[] | undefined) {
  // Premium Özellikler: Maç Detay Çekmecesi
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // URL ?match=id senkronizasyonu ve maç seçimi
  const handleSelectMatch = useCallback((match: Match | null) => {
    setSelectedMatch(match);
    if (match) {
      setIsMobileDrawerOpen(true);
    }
    if (typeof window !== "undefined" && match) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("match", match.id);
        replaceUrlIfChanged(url);
      } catch {
        // fallback
      }
    }
  }, []);

  // Sayfa ilk açıldığında veya maçlar değiştiğinde:
  // Varsa o günün ilk canlı maçı, yoksa ilk biten maçı varsayılan olarak seçili getir
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    let urlMatchId: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        urlMatchId = params.get("match");
      } catch {
        // fallback
      }
    }

    setSelectedMatch((prev) => {
      if (prev && matches.some((m) => m.id === prev.id)) {
        return prev;
      }
      return findDefaultSelectedMatch(matches, urlMatchId);
    });
  }, [matches]);

  return {
    selectedMatch,
    setSelectedMatch,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    handleSelectMatch,
  };
}
