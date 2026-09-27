"use client";

import React, { useState, useMemo } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { DateNavigationRibbon, StatusFilterType } from "./DateNavigationRibbon";
import { LeagueSection } from "./LeagueSection";
import { formatLeagueCategoryTitle } from "@/utils/grouping";
import { isMatchScored } from "@/context/MatchSelectionContext";
import { useFavorites } from "@/utils/useFavorites";
import { SearchX, Calendar, Sparkles } from "lucide-react";

interface CompactMatchFeedProps {
  matches: Match[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  todayStr: string;
  yesterdayStr: string;
  city?: string;
}

export const CompactMatchFeed: React.FC<CompactMatchFeedProps> = ({
  matches = [],
  selectedMatchId,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  todayStr,
  yesterdayStr,
  city,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr || "all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const { isFavorite: isTeamFavorite } = useFavorites();

  // Durum bazlı toplam sayıları hesapla
  const counts = useMemo(() => {
    let all = 0;
    let live = 0;
    let finished = 0;
    let upcoming = 0;

    matches.forEach((m) => {
      // Tarih filtresine göre say
      if (selectedDate !== "all" && m.date !== selectedDate) return;

      all += 1;
      if (m.status === "live") live += 1;
      else if (m.status === "finished" || isMatchScored(m)) finished += 1;
      else upcoming += 1;
    });

    return { all, live, finished, upcoming };
  }, [matches, selectedDate]);

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // 1. Tarih filtresi
      if (selectedDate !== "all" && m.date !== selectedDate) {
        return false;
      }

      // 2. Durum filtresi (Tümü, Canlı, Biten, Program)
      if (statusFilter === "live" && m.status !== "live") return false;
      if (statusFilter === "finished" && m.status !== "finished" && !isMatchScored(m)) return false;
      if (statusFilter === "upcoming" && (m.status === "finished" || isMatchScored(m) || m.status === "live")) return false;

      return true;
    });
  }, [matches, selectedDate, statusFilter]);

  // Liglerine göre grupla: Map<LeagueKey, { leagueTitle: string, cityName?: string, matches: Match[] }>
  const groupedByLeague = useMemo(() => {
    const map = new Map<string, { leagueTitle: string; cityName?: string; matches: Match[] }>();

    filteredMatches.forEach((m) => {
      const matchCity = m.city || city || "";
      const rawCategory = m.category || m.age_group || "Genel Lig";
      const leagueTitle = formatLeagueCategoryTitle(rawCategory, m.age_group);
      const key = `${matchCity}::${leagueTitle}`;

      if (!map.has(key)) {
        map.set(key, {
          leagueTitle,
          cityName: matchCity,
          matches: [],
        });
      }
      map.get(key)!.matches.push(m);
    });

    // Grupları sırala ve maçları saat sırasına diz
    const result = Array.from(map.values()).sort((a, b) => {
      if (a.cityName && b.cityName && a.cityName !== b.cityName) {
        return a.cityName.localeCompare(b.cityName, "tr");
      }
      return a.leagueTitle.localeCompare(b.leagueTitle, "tr");
    });

    result.forEach((g) => {
      g.matches.sort((m1, m2) => (m1.time || "").localeCompare(m2.time || ""));
    });

    return result;
  }, [filteredMatches, city]);

  return (
    <div className="space-y-3">
      {/* 1. DateNavigationRibbon: Sticky Tarih Şeridi & Durum Filtre Hapları */}
      <DateNavigationRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayStr={todayStr}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
        counts={counts}
      />

      {/* 2. Lig Bazlı Kompakt Maç Akışı */}
      {groupedByLeague.length > 0 ? (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {groupedByLeague.map((g, idx) => (
            <LeagueSection
              key={`${g.cityName}-${g.leagueTitle}-${idx}`}
              leagueTitle={g.leagueTitle}
              cityName={g.cityName}
              matches={g.matches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={onSelectMatch}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Boş Durum */
        <div className="text-center py-12 bg-[#181A20] border border-[#2A2E3D] rounded-2xl p-6 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-[#1E222D] border border-[#2A2E3D] flex items-center justify-center mx-auto mb-3 text-[#64748B]">
            <SearchX size={22} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            Seçilen Kriterlere Uygun Maç Bulunamadı
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mb-4">
            {selectedDate !== "all"
              ? `${selectedDate} tarihinde seçilen durum filtresine uygun karşılaşma kaydı bulunmuyor.`
              : "Bu kriterlere ait bültende maç bulunmamaktadır."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDate("all");
              setStatusFilter("all");
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Filtreleri Sıfırla (Tümünü Göster)
          </button>
        </div>
      )}
    </div>
  );
};
