"use client";

import React from "react";
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
    </div>
  );
};
