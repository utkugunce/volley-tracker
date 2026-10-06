"use client";

import React, { useMemo } from "react";
import { FixtureTable } from "@/components/FixtureTable";
import { sameGroup } from "@/utils/standingsForm";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { StandingItem, Match } from "@/types/fixture";
import { useStandingsSelection } from "@/hooks/useStandingsSelection";
import { useStandingsCityDropdown } from "@/hooks/useStandingsCityDropdown";
import { useStandingsRowExpansion } from "@/hooks/useStandingsRowExpansion";
import type { StandingsTeamContext } from "@/utils/standingsParsing";
import { StandingsEmptyState } from "./standings/StandingsEmptyState";
import { StandingsSelectorBar } from "./standings/StandingsSelectorBar";
import { StandingsHeaderStrip } from "./standings/StandingsHeaderStrip";
import { StandingsNoDataState } from "./standings/StandingsNoDataState";
import { StandingsTableView } from "./standings/StandingsTableView";
import { StandingsLegend } from "./standings/StandingsLegend";

// Dış API'yi koru: testler ve diğer bileşenler bu dışa aktarımlara bağlı.
export type { StandingsTeamContext } from "@/utils/standingsParsing";
export { generateStandingsCsv, downloadStandingsCsv } from "@/utils/standingsCsv";
export { summarizeTeam, type FormResult } from "@/utils/standingsForm";
export { FormDots } from "./standings/FormDots";

interface StandingsTableProps {
  standingsData: {
    [category: string]: StandingItem[];
  };
  city?: string;
  matches?: Match[];
  onSelectTeam?: (team: StandingItem, context: StandingsTeamContext) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standingsData, city, matches, onSelectTeam }) => {
  const {
    allKeys,
    distinctCities,
    selectedCity,
    setSelectedCity,
    availableAgeGroups,
    selectedAgeGroup,
    setSelectedAgeGroup,
    availableLeagues,
    selectedLeagueTier,
    setSelectedLeagueTier,
    availableGroups,
    selectedGroupKey,
    setSelectedGroupKey,
    activeContext,
    items,
  } = useStandingsSelection(standingsData, city);

  const cityDropdown = useStandingsCityDropdown(distinctCities, setSelectedCity);

  const { expandedTeam, toggleDetail } = useStandingsRowExpansion(activeContext, city, onSelectTeam);

  // Seçili lig/gruba ait maçlar (puan durumu altında sonuçlar & fikstür için)
  const { finishedMatches, upcomingMatches } = useMemo(() => {
    if (!matches?.length || !activeContext) {
      return { finishedMatches: [] as Match[], upcomingMatches: [] as Match[] };
    }
    const ctxCity = activeContext.city || city || "";
    const league = trLower(activeContext.leagueFullName || "");
    const inContext = matches.filter((m) => {
      if (ctxCity && m.city && trLower(m.city) !== trLower(ctxCity)) return false;
      if (league && m.category) {
        const cat = trLower(m.category);
        if (!trIncludes(cat, league) && !trIncludes(league, cat)) return false;
      }
      if (activeContext.displayGroup && m.group && !sameGroup(m.group, activeContext.displayGroup)) return false;
      return true;
    });
    const key = (m: Match) => `${m.date} ${m.time || ""}`;
    return {
      finishedMatches: inContext
        .filter((m) => m.status === "finished")
        .sort((a, b) => key(b).localeCompare(key(a))),
      upcomingMatches: inContext
        .filter((m) => m.status === "upcoming" || m.status === "live")
        .sort((a, b) => key(a).localeCompare(key(b))),
    };
  }, [matches, activeContext, city]);

  if (allKeys.length === 0) {
    return <StandingsEmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Kategori, Lig ve Grup Seçici Barı */}
      <StandingsSelectorBar
        distinctCities={distinctCities}
        selectedCity={selectedCity}
        dropdown={cityDropdown}
        availableAgeGroups={availableAgeGroups}
        selectedAgeGroup={selectedAgeGroup}
        setSelectedAgeGroup={setSelectedAgeGroup}
        availableLeagues={availableLeagues}
        selectedLeagueTier={selectedLeagueTier}
        setSelectedLeagueTier={setSelectedLeagueTier}
        availableGroups={availableGroups}
        selectedGroupKey={selectedGroupKey}
        setSelectedGroupKey={setSelectedGroupKey}
      />

      {/* Puan Durumu Tablosu veya Boş Durum */}
      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        {/* Başlık Şeridi */}
        <StandingsHeaderStrip activeContext={activeContext} city={city} items={items} />

        {/* Tablo veya Boş Durum (Empty State) */}
        {items.length === 0 ? (
          <StandingsNoDataState activeContext={activeContext} />
        ) : (
          <StandingsTableView
            items={items}
            activeContext={activeContext}
            city={city}
            matches={matches}
            expandedTeam={expandedTeam}
            toggleDetail={toggleDetail}
          />
        )}

        {/* Alt Açıklama / Legend */}
        <StandingsLegend />
      </div>

      {/* Puan Durumu Altında: Sonuçlar */}
      {finishedMatches.length > 0 && (
        <FixtureTable
          title="Oynanan Maç Sonuçları"
          subTitle={`${activeContext?.leagueFullName || ""} ${activeContext?.displayGroup || ""}`.trim()}
          matches={finishedMatches}
          city={activeContext?.city || city}
          showCityBadge={false}
        />
      )}

      {/* Puan Durumu Altında: Fikstür */}
      {upcomingMatches.length > 0 && (
        <FixtureTable
          title="Fikstür & Gelecek Maç Programı"
          subTitle={`${activeContext?.leagueFullName || ""} ${activeContext?.displayGroup || ""}`.trim()}
          matches={upcomingMatches}
          city={activeContext?.city || city}
          showCityBadge={false}
        />
      )}
    </div>
  );
};
