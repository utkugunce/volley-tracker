import { useEffect, useState } from "react";
import type { Match } from "@/types/fixture";
import { PAGE_SIZE } from "@/utils/fixtureTable";

/**
 * "Daha fazla göster" sayfalaması: maç listesi değişince sıfırlanır,
 * yazdırmadan önce (beforeprint) tüm maçları gösterir.
 */
export function useFixturePagination(matches: Match[]) {
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [matches]);

  useEffect(() => {
    const handleBeforePrint = () => setVisibleLimit(matches.length);
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [matches.length]);

  const visibleMatches = matches.length > PAGE_SIZE ? matches.slice(0, visibleLimit) : matches;
  const remainingCount = matches.length - visibleMatches.length;

  return { setVisibleLimit, visibleMatches, remainingCount };
}
