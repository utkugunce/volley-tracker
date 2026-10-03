import { useCallback, useState } from "react";
import type { StandingItem } from "@/types/fixture";
import type { ParsedStandingContext, StandingsTeamContext } from "@/utils/standingsParsing";

/** Puan durumu satırının açılıp kapanması ve takım seçimi bildirimi. */
export function useStandingsRowExpansion(
  activeContext: ParsedStandingContext | undefined,
  city: string | undefined,
  onSelectTeam?: (team: StandingItem, context: StandingsTeamContext) => void
) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Satır açılır/kapanır
  const toggleDetail = useCallback(
    (row: StandingItem) => {
      const teamKey = `${row.rank}-${row.team}`;
      setExpandedTeam((prev) => (prev === teamKey ? null : teamKey));
      if (onSelectTeam && activeContext) {
        onSelectTeam(row, {
          rawKey: activeContext.rawKey || "",
          city: activeContext.city || city || "",
          leagueName: activeContext.leagueFullName || "",
          groupName: activeContext.displayGroup || "",
        });
      }
    },
    [onSelectTeam, activeContext, city]
  );

  return { expandedTeam, toggleDetail };
}
