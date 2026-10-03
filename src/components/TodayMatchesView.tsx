"use client";

import React, { useState } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { useTodayMatchesData } from "@/hooks/useTodayMatchesData";
import { TodayKpiCards } from "@/components/today/TodayKpiCards";
import { ActiveCityTabs } from "@/components/today/ActiveCityTabs";
import { TodayHeaderBar, type TodayDisplayMode } from "@/components/today/TodayHeaderBar";
import { TodayMatchCard } from "@/components/today/TodayMatchCard";
import { TodayTableSections } from "@/components/today/TodayTableSections";
import { TodayNoMatchState } from "@/components/today/TodayNoMatchState";
import { NextMatchDaySection } from "@/components/today/NextMatchDaySection";
import { RecentFinishedSection } from "@/components/today/RecentFinishedSection";

interface TodayMatchesViewProps {
  matches: Match[];
  city?: string;
  currentCitySlug?: string;
  onSelectCity?: (slug: string) => void;
  citiesList?: CityInfo[];
  todayStr: string;
  yesterdayStr?: string;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onNavigateToFullFixtures?: () => void;
  onSelectMatch?: (match: Match) => void;
}

export const TodayMatchesView: React.FC<TodayMatchesViewProps> = ({
  matches = [],
  city = "Tüm İller",
  currentCitySlug = "all",
  onSelectCity,
  citiesList = [],
  todayStr,
  yesterdayStr,
  favorites,
  onToggleFavorite,
  onNavigateToFullFixtures = () => {},
  onSelectMatch,
}) => {
  const [displayMode, setDisplayMode] = useState<TodayDisplayMode>("cards");

  const {
    quickStatus,
    setQuickStatus,
    effectiveYesterdayStr,
    todayMatches,
    isMatchFavorite,
    todayFavoritesCount,
    filteredTodayMatches,
    dashboardKpis,
    nextMatchDay,
    recentFinishedDay,
    groupedSections,
    nextGroupedSections,
    formattedToday,
    activeCityCards,
  } = useTodayMatchesData({ matches, city, citiesList, todayStr, yesterdayStr, favorites });

  // Tekil bir maç kartı (Dashboard Match Card)
  const renderDashboardMatchCard = (m: Match) => (
    <TodayMatchCard
      key={m.id}
      match={m}
      city={city}
      effectiveYesterdayStr={effectiveYesterdayStr}
      isFav={isMatchFavorite(m)}
      onToggleFavorite={onToggleFavorite}
      onSelectMatch={onSelectMatch}
    />
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. DASHBOARD KPI METRİK KARTLARI */}
      <TodayKpiCards city={city} dashboardKpis={dashboardKpis} nextMatchDay={nextMatchDay} />

      {/* 2. AKTİF İL HIZLI KARTLARI */}
      {onSelectCity && (
        <ActiveCityTabs
          citiesList={citiesList}
          activeCityCards={activeCityCards}
          currentCitySlug={currentCitySlug}
          onSelectCity={onSelectCity}
        />
      )}

      {/* 3. ANA GÜNÜN MAÇLARI / PROGRAM BAŞLIK ÇUBUĞU */}
      <TodayHeaderBar
        city={city}
        formattedToday={formattedToday}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        onNavigateToFullFixtures={onNavigateToFullFixtures}
        todayMatchesCount={todayMatches.length}
        quickStatus={quickStatus}
        setQuickStatus={setQuickStatus}
        dashboardKpis={dashboardKpis}
        todayFavoritesCount={todayFavoritesCount}
      />

      {/* 4. BUGÜNÜN MAÇLARI GÖRÜNÜMÜ */}
      {filteredTodayMatches.length > 0 ? (
        displayMode === "cards" ? (
          /* Kart Görünümü (Dashboard Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredTodayMatches.map((m) => renderDashboardMatchCard(m))}
          </div>
        ) : (
          /* Tablo Görünümü */
          <TodayTableSections
            sections={groupedSections}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            city={city}
            onSelectMatch={onSelectMatch}
          />
        )
      ) : (
        /* 5. BUGÜN MAÇ YOKSA VEYA FİLTREDE BULUNAMADIYSA */
        <div className="space-y-6">
          <TodayNoMatchState
            todayMatchesCount={todayMatches.length}
            formattedToday={formattedToday}
            city={city}
            onNavigateToFullFixtures={onNavigateToFullFixtures}
            onResetFilter={() => setQuickStatus("all")}
          />

          {/* Akıllı Yedek Görünüm 1: Sıradaki En Yakın Maç Günü */}
          {nextMatchDay && nextMatchDay.matches.length > 0 && (
            <NextMatchDaySection
              nextMatchDay={nextMatchDay}
              displayMode={displayMode}
              renderMatchCard={renderDashboardMatchCard}
              nextGroupedSections={nextGroupedSections}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              city={city}
              onSelectMatch={onSelectMatch}
            />
          )}

          {/* Akıllı Yedek Görünüm 2: Son Tamamlanan Karşılaşmalar */}
          {recentFinishedDay && recentFinishedDay.matches.length > 0 && (
            <RecentFinishedSection
              recentFinishedDay={recentFinishedDay}
              renderMatchCard={renderDashboardMatchCard}
            />
          )}
        </div>
      )}
    </div>
  );
};
