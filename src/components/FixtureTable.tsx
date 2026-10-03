"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { formatGroupName } from "@/utils/grouping";
import { useFixtureCollapse } from "@/hooks/useFixtureCollapse";
import { useFixturePagination } from "@/hooks/useFixturePagination";
import { useFixtureActions } from "@/hooks/useFixtureActions";
import { FixtureTableHeader, type FixtureViewMode } from "./fixture/FixtureTableHeader";
import { FixtureListView } from "./fixture/FixtureListView";
import { FixtureGridView } from "./fixture/FixtureGridView";
import { FixtureLoadMore } from "./fixture/FixtureLoadMore";

interface FixtureTableProps {
  title: string;
  subTitle?: string;
  matches: Match[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  city?: string;
  showCityBadge?: boolean;
  onSelectMatch?: (match: Match) => void;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  defaultCollapsed?: boolean;
}

export const FixtureTable: React.FC<FixtureTableProps> = ({
  title,
  subTitle,
  matches,
  favorites = [],
  onToggleFavorite,
  city = "İstanbul",
  showCityBadge = false,
  onSelectMatch,
  isCollapsible = true,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
  defaultCollapsed = false,
}) => {
  const { isCollapsed, handleToggleCollapse } = useFixtureCollapse(
    isCollapsible,
    controlledIsCollapsed,
    onToggleCollapse,
    defaultCollapsed
  );

  const [viewMode, setViewMode] = useState<FixtureViewMode>("table");
  const { setVisibleLimit, visibleMatches, remainingCount } = useFixturePagination(matches);

  const effectiveCity = city && city !== "Tüm İller" ? city : matches[0]?.city;

  const { copiedId, handleCopy, handleDownloadIcs, handleDownloadFavoritesIcs } = useFixtureActions(
    matches,
    favorites,
    effectiveCity,
    city
  );

  // Çoklu grup ayrımı kontrolü (A Grubu, B Grubu vb.)
  const distinctGroups = React.useMemo(() => {
    return Array.from(new Set(matches.map((m) => formatGroupName(m.group)).filter(Boolean)));
  }, [matches]);
  const hasMultipleGroups = distinctGroups.length > 1;

  return (
    <div className="glass-panel rounded-2xl shadow-card border-slate-800/80 overflow-hidden mb-4 transition-all duration-200">
      {/* 1. Grup Başlığı */}
      <FixtureTableHeader
        title={title}
        subTitle={subTitle}
        showCityBadge={showCityBadge}
        effectiveCity={effectiveCity}
        isCollapsible={isCollapsible}
        isCollapsed={isCollapsed}
        handleToggleCollapse={handleToggleCollapse}
        viewMode={viewMode}
        setViewMode={setViewMode}
        matches={matches}
        favorites={favorites}
        handleDownloadFavoritesIcs={handleDownloadFavoritesIcs}
      />

      {/* 2. Resmi TVF / Fikstür Tablosu: Tarih - Yer - Saat - A Takımı - B Takımı - Skor - Set Skorları - Volleybox - İşlem */}
      {!isCollapsed && (
        <>
          {viewMode === "table" ? (
            <FixtureListView
              visibleMatches={visibleMatches}
              matches={matches}
              hasMultipleGroups={hasMultipleGroups}
              favorites={favorites}
              copiedId={copiedId}
              effectiveCity={effectiveCity}
              city={city}
              onToggleFavorite={onToggleFavorite}
              onSelectMatch={onSelectMatch}
              handleCopy={handleCopy}
              handleDownloadIcs={handleDownloadIcs}
            />
          ) : (
            /* 3. Yayın Tarzı Grid Kart Görünümü (Broadcast Cards) */
            <FixtureGridView
              visibleMatches={visibleMatches}
              matches={matches}
              hasMultipleGroups={hasMultipleGroups}
              favorites={favorites}
              copiedId={copiedId}
              effectiveCity={effectiveCity}
              onToggleFavorite={onToggleFavorite}
              onSelectMatch={onSelectMatch}
              handleCopy={handleCopy}
              handleDownloadIcs={handleDownloadIcs}
            />
          )}

          {/* 4. Sayfalama / Daha Fazla Göster (DOM yükünü hafifletir) */}
          {remainingCount > 0 && (
            <FixtureLoadMore
              remainingCount={remainingCount}
              totalCount={matches.length}
              setVisibleLimit={setVisibleLimit}
            />
          )}
        </>
      )}
    </div>
  );
};
