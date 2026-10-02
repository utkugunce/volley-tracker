"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Star } from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { DateNavigationRibbon, StatusFilterType } from "@/components/match/DateNavigationRibbon";
import { LeagueSection } from "@/components/match/LeagueSection";
import { useFavorites } from "@/utils/useFavorites";
import { convertK2MatchToMatch, normalizeK2Date, getKadinlar2LigMatchTeamNames, isKadinlar2LigMatchFavorite, kadinlar2LigMatchHasTeamQuery } from "@/utils/kadinlar2LigConverter";
import { getKadinlar2LigRoute } from "@/utils/kadinlar2LigRoutes";

interface Kadinlar2LigTodayMatchesProps {
  allMatches: Kadinlar2LigMatch[];
  groups: Kadinlar2LigGroup[];
  onSelectMatch: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  searchQuery?: string;
  selectedMatchId?: string | null;
}

export const Kadinlar2LigTodayMatches: React.FC<Kadinlar2LigTodayMatchesProps> = ({
  allMatches,
  groups,
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  searchQuery = "",
  selectedMatchId,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [todayStr, setTodayStr] = useState("");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  useEffect(() => {
    const now = new Date();
    setTodayStr(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  }, []);

  const { uniqueDates, initialSelectedDate } = useMemo(() => {
    const dates = Array.from(new Set(allMatches.map((match) => normalizeK2Date(match.tarih)).filter((date) => date !== "TBD"))).sort();

    const defaultDate = dates.includes(todayStr)
      ? todayStr
      : dates.find((date) => date >= todayStr) || dates[0] || "all";

    return {
      uniqueDates: dates,
      initialSelectedDate: defaultDate,
    };
  }, [allMatches, todayStr]);

  useEffect(() => {
    if (todayStr) setSelectedDate(initialSelectedDate);
  }, [todayStr, initialSelectedDate]);

  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");

  const statusCounts = useMemo(() => {
    const matchesForDate = allMatches.filter((match) =>
      (selectedDate === "all" || normalizeK2Date(match.tarih) === selectedDate) &&
      (selectedGroupFilter === "all" || match.grup_no === selectedGroupFilter)
    );
    const finished = matchesForDate.filter((match) => match.durum === "BİTTİ" || (match.skor && match.skor.includes("-") && match.skor !== "- : -")).length;
    return { all: matchesForDate.length, live: 0, finished, upcoming: matchesForDate.length - finished };
  }, [allMatches, selectedDate, selectedGroupFilter]);

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (selectedDate !== "all" && normalizeK2Date(m.tarih) !== selectedDate) return false;
      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      if (statusFilter === "finished" && m.durum !== "BİTTİ" && (!m.skor || !m.skor.includes("-") || m.skor === "- : -")) return false;
      if (statusFilter === "upcoming" && (m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -"))) return false;
      if (statusFilter === "live") return false;
      if (showOnlyFavorites) {
        if (!isKadinlar2LigMatchFavorite(m, isFavorite)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = kadinlar2LigMatchHasTeamQuery(m, q);
        const inCity = m.sehir.toLowerCase().includes(q);
        const inHall = m.salon.toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }
      return true;
    });
  }, [allMatches, selectedDate, selectedGroupFilter, statusFilter, showOnlyFavorites, searchQuery, isFavorite]);

  const matchesByGroup = useMemo(() => {
    const grouped = new Map<number, Kadinlar2LigMatch[]>();
    filteredMatches.forEach((match) => {
      const groupNo = match.grup_no || 1;
      if (!grouped.has(groupNo)) grouped.set(groupNo, []);
      grouped.get(groupNo)!.push(match);
    });
    return Array.from(grouped.entries()).sort(([groupA], [groupB]) => groupA - groupB);
  }, [filteredMatches]);

  const favoriteMatchIds = useMemo(
    () => allMatches.filter((match) => isKadinlar2LigMatchFavorite(match, isFavorite)).map((match) => match.id),
    [allMatches, isFavorite]
  );

  const handleToggleFavorite = (matchId: string) => {
    const match = allMatches.find((item) => item.id === matchId);
    if (match) toggleFavorite(getKadinlar2LigMatchTeamNames(match).home);
  };

  const selectStatus = (status: StatusFilterType) => setStatusFilter(status);

  return (
    <div className="space-y-4">
      <DateNavigationRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayStr={todayStr}
        statusFilter={statusFilter}
        onSelectStatusFilter={selectStatus}
        counts={statusCounts}
        availableDates={uniqueDates}
      />

      {/* 2. Filtre Barı (Grup, Durum, Favoriler) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Grup Filtresi */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Grup:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-primary/40 cursor-pointer"
            >
              <option value="all">Tüm Gruplar (1-16)</option>
              {groups.map((g) => (
                <option key={g.grup_no} value={g.grup_no}>
                  {g.grup_adi} ({g.takim_sayisi} Takım)
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Favoriler Filtresi Butonu */}
        {onToggleFavoritesOnly && (
          <button
            onClick={onToggleFavoritesOnly}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showOnlyFavorites
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold"
                : "bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700/80"
            }`}
            title="Sadece takip ettiğim kulüplerin maçlarını listele"
          >
            <Star size={12} className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"} />
            <span>Favori Takımlarım</span>
          </button>
        )}
      </div>

      {/* 3. Maç Listesi */}
      {matchesByGroup.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-10 text-center space-y-3 shadow-card">
          <Calendar size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">Bu filtrede maç bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {showOnlyFavorites
              ? "Favoriye eklediğiniz kulüplerin bu tarih veya grupta maçı bulunmuyor."
              : "Seçili tarih veya grup filtresine uyan karşılaşma yok. Farklı bir tarih seçebilirsiniz."}
          </p>
          {selectedDate !== "all" && (
            <button
              onClick={() => setSelectedDate("all")}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-semibold"
            >
              Tüm Tarihleri Göster
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {matchesByGroup.map(([groupNo, groupMatches]) => (
            <LeagueSection
              key={groupNo}
              leagueTitle="Kadınlar 2. Ligi"
              sectionLabel={`Grup ${groupNo}`}
              matches={groupMatches.map(convertK2MatchToMatch)}
              selectedMatchId={selectedMatchId}
              favorites={favoriteMatchIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectMatch={onSelectMatch}
              mode="today"
              standingsHref={getKadinlar2LigRoute("standings", groupNo)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
