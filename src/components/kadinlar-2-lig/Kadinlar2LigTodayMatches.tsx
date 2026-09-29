"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Star } from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { DateRibbon } from "@/components/DateRibbon";
import { FixtureTable } from "@/components/FixtureTable";
import { useFavorites } from "@/utils/useFavorites";
import { convertK2MatchToMatch, normalizeK2Date } from "@/utils/kadinlar2LigConverter";

interface Kadinlar2LigTodayMatchesProps {
  allMatches: Kadinlar2LigMatch[];
  groups: Kadinlar2LigGroup[];
  onSelectMatch: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  searchQuery?: string;
}

export const Kadinlar2LigTodayMatches: React.FC<Kadinlar2LigTodayMatchesProps> = ({
  allMatches,
  groups,
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  searchQuery = "",
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { uniqueDates, dateCounts, initialSelectedDate } = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    allMatches.forEach((m) => {
      const date = normalizeK2Date(m.tarih);
      if (date !== "TBD") {
        counts[date] = (counts[date] || 0) + 1;
      }
    });

    const dates = Object.keys(counts).sort();

    let defaultDate = "all";
    if (counts[todayStr]) {
      defaultDate = todayStr;
    } else {
      const upcoming = dates.find((d) => d >= todayStr);
      defaultDate = upcoming || dates[0] || "all";
    }

    return {
      uniqueDates: dates,
      dateCounts: counts,
      initialSelectedDate: defaultDate,
    };
  }, [allMatches, todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OYNANACAK" | "BİTTİ">("all");

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (selectedDate !== "all" && normalizeK2Date(m.tarih) !== selectedDate) return false;
      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
      if (showOnlyFavorites) {
        const homeFav = isFavorite(m.takim_a);
        const awayFav = isFavorite(m.takim_b);
        if (!homeFav && !awayFav) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
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
    () => allMatches.filter((match) => isFavorite(match.takim_a) || isFavorite(match.takim_b)).map((match) => match.id),
    [allMatches, isFavorite]
  );

  const handleToggleFavorite = (matchId: string) => {
    const match = allMatches.find((item) => item.id === matchId);
    if (match) toggleFavorite(match.takim_a);
  };

  return (
    <div className="space-y-4">
      {/* 1. Tarih Şeridi */}
      {uniqueDates.length > 0 && (
        <DateRibbon
          dates={uniqueDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dateCounts={dateCounts}
          todayStr={todayStr}
        />
      )}

      {/* 2. Filtre Barı (Grup, Durum, Favoriler) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Grup Filtresi */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Grup:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Tüm Gruplar (1-16)</option>
              {groups.map((g) => (
                <option key={g.grup_no} value={g.grup_no}>
                  {g.grup_adi} ({g.takim_sayisi} Takım)
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("OYNANACAK")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "OYNANACAK" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Oynanacak
            </button>
            <button
              onClick={() => setStatusFilter("BİTTİ")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "BİTTİ" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Bitenler
            </button>
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
            <FixtureTable
              key={groupNo}
              title="Kadınlar 2. Ligi"
              subTitle={`Grup ${groupNo}`}
              matches={groupMatches.map(convertK2MatchToMatch)}
              favorites={favoriteMatchIds}
              onToggleFavorite={handleToggleFavorite}
              city="Türkiye"
              showCityBadge={false}
              onSelectMatch={onSelectMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};
