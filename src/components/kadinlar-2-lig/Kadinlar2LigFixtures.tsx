"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Star,
  Download,
  Printer,
  AlertTriangle,
  RotateCcw,
  SearchX,
} from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { LeagueSection } from "@/components/match/LeagueSection";
import { DateNavigationRibbon } from "@/components/match/DateNavigationRibbon";
import { convertK2MatchToMatch, getKadinlar2LigMatchTeamNames, isKadinlar2LigMatchFavorite, kadinlar2LigMatchHasTeamQuery } from "@/utils/kadinlar2LigConverter";
import { generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { useFavorites } from "@/utils/useFavorites";
import { PrintScheduleButton } from "@/components/PrintScheduleButton";
import { isMatchOverdueForScore } from "@/utils/calendar";
import { getKadinlar2LigRoute } from "@/utils/kadinlar2LigRoutes";

interface Kadinlar2LigFixturesProps {
  group?: Kadinlar2LigGroup;
  groups?: Kadinlar2LigGroup[];
  allMatches?: Kadinlar2LigMatch[];
  isAllGroups?: boolean;
  searchQuery?: string;
  onSelectMatch?: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  selectedMatchId?: string | null;
}

export const Kadinlar2LigFixtures: React.FC<Kadinlar2LigFixturesProps> = ({
  group,
  groups,
  allMatches,
  isAllGroups = false,
  searchQuery = "",
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  selectedMatchId,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OYNANACAK" | "BİTTİ" | "CANLI">("all");
  const [volleyboxFilter, setVolleyboxFilter] = useState<
    "all" | "scored" | "unscored" | "unsynced" | "discrepancy"
  >("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [todayIso, setTodayIso] = useState("");

  const isAll = Boolean(isAllGroups || !group);

  useEffect(() => {
    const now = new Date();
    setTodayIso(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  }, []);

  const matches = useMemo(() => {
    if (isAll) {
      if (allMatches && allMatches.length > 0) return allMatches;
      if (groups && groups.length > 0) {
        return groups.flatMap((g) => g.fikstur || []);
      }
      return group?.fikstur || [];
    }
    return group?.fikstur || [];
  }, [isAll, allMatches, groups, group?.fikstur]);

  // Hafta listesi
  const weeks = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => {
      if (m.hafta) set.add(m.hafta);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const fixtureDates = useMemo(() => {
    return Array.from(
      new Set(
        matches
          .map((match) => convertK2MatchToMatch(match).date)
          .filter((date) => date && date !== "TBD")
      )
    ).sort();
  }, [matches]);

  const dateCounts = useMemo(() => {
    const scopedMatches = matches.filter(
      (match) => selectedWeek === "all" || match.hafta === selectedWeek
    );
    const matchesForDate =
      selectedDate === "all"
        ? scopedMatches
        : scopedMatches.filter(
            (match) => convertK2MatchToMatch(match).date === selectedDate
          );
    const finished = matchesForDate.filter(
      (match) =>
        match.durum === "BİTTİ" ||
        (match.skor && match.skor.includes("-") && match.skor !== "- : -")
    ).length;
    return {
      all: matchesForDate.length,
      live: 0,
      finished,
      upcoming: matchesForDate.length - finished,
    };
  }, [matches, selectedWeek, selectedDate]);

  // Volleybox Eşleşme İstatistikleri (Tümü, Skorlu, Skorsuz, Girilmedi, Değişenler)
  const volleyboxStats = useMemo(() => {
    const total = matches.length;
    const scored = matches.filter(
      (m) =>
        m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -")
    ).length;
    const unscored = matches.filter(
      (m) =>
        Boolean(m.takim_a_volleybox_url && m.takim_b_volleybox_url) &&
        m.durum !== "BİTTİ" &&
        (!m.skor || !m.skor.includes("-") || m.skor === "- : -") &&
        isMatchOverdueForScore(m.tarih)
    ).length;
    const unsynced = matches.filter(
      (m) => !m.takim_a_volleybox_url || !m.takim_b_volleybox_url
    ).length;
    const discrepancy = matches.filter(
      (m) =>
        Boolean(m.discrepancy?.has_diff || m.volleybox?.discrepancy?.has_diff)
    ).length;

    return { total, scored, unscored, unsynced, discrepancy };
  }, [matches]);

  const handleVolleyboxFilterChange = (
    filter: "all" | "scored" | "unscored" | "unsynced" | "discrepancy"
  ) => {
    setVolleyboxFilter(filter);
    if (filter === "discrepancy") {
      // Değişenler seçildiğinde tarih ve hafta filtrelerini sıfırla ki kullanıcı tüm değişen maçları anında görsün
      setSelectedDate("all");
      setSelectedWeek("all");
    }
  };

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Değişenler filtresi etkinse ve belirli bir hafta seçilmediyse veya maç farklı tarihteyse kısıtlamayalım
      if (volleyboxFilter !== "discrepancy") {
        if (selectedWeek !== "all" && m.hafta !== selectedWeek) return false;
        if (selectedDate !== "all" && convertK2MatchToMatch(m).date !== selectedDate) return false;
      } else {
        if (selectedWeek !== "all" && m.hafta !== selectedWeek) return false;
        if (selectedDate !== "all" && convertK2MatchToMatch(m).date !== selectedDate) return false;
      }

      if (statusFilter === "CANLI") return false;
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
      if (showOnlyFavorites) {
        if (!isKadinlar2LigMatchFavorite(m, isFavorite)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = kadinlar2LigMatchHasTeamQuery(m, q);
        const inCity = m.sehir?.toLowerCase().includes(q);
        const inHall = m.salon?.toLowerCase().includes(q);
        const inGroup =
          m.grup_adi?.toLowerCase().includes(q) || `grup ${m.grup_no}`.includes(q);
        if (!inTeams && !inCity && !inHall && !inGroup) return false;
      }

      // Volleybox filtreleri
      const isScored =
        m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -");
      const isSynced = Boolean(m.takim_a_volleybox_url && m.takim_b_volleybox_url);
      const hasDiscrepancy = Boolean(
        m.discrepancy?.has_diff || m.volleybox?.discrepancy?.has_diff
      );

      if (volleyboxFilter === "scored" && !isScored) return false;
      if (
        volleyboxFilter === "unscored" &&
        (!isSynced || isScored || !isMatchOverdueForScore(m.tarih))
      ) {
        return false;
      }
      if (volleyboxFilter === "unsynced" && isSynced) return false;
      if (volleyboxFilter === "discrepancy" && !hasDiscrepancy) return false;

      return true;
    });
  }, [
    matches,
    selectedWeek,
    selectedDate,
    statusFilter,
    showOnlyFavorites,
    searchQuery,
    volleyboxFilter,
    isFavorite,
  ]);

  // Sezon Takvimi İndir (.ics)
  const handleDownloadSeasonIcs = () => {
    const converted = filteredMatches.map(convertK2MatchToMatch);
    const title = isAll
      ? "Kadınlar 2. Ligi Tüm Gruplar Fikstürü"
      : `Kadınlar 2. Ligi ${group?.grup_adi || ""} Fikstürü`;
    const fileName = isAll
      ? "kadinlar-2-ligi-tum-gruplar-fikstur.ics"
      : `kadinlar-2-ligi-${group?.grup_no || 1}-grup-fikstur.ics`;
    const ics = generateSeasonIcs(converted, title);
    downloadIcsFile(fileName, ics);
  };

  // Favori maç ID'leri
  const favoriteMatchIds = useMemo(() => {
    return matches
      .filter((m) => isKadinlar2LigMatchFavorite(m, isFavorite))
      .map((m) => m.id);
  }, [matches, isFavorite]);

  const handleToggleFavorite = (matchId: string) => {
    const found = matches.find((m) => m.id === matchId);
    if (found) {
      toggleFavorite(getKadinlar2LigMatchTeamNames(found).home);
    }
  };

  // Gruplara veya haftalara göre bölümlendirme
  const fixtureSections = useMemo(() => {
    if (!isAll && group) {
      // Tek bir grup seçili: Haftalara göre listele
      const map = new Map<number, Kadinlar2LigMatch[]>();
      filteredMatches.forEach((m) => {
        const w = m.hafta || 1;
        if (!map.has(w)) map.set(w, []);
        map.get(w)!.push(m);
      });
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNum, weekMatches]) => ({
          key: `week-${weekNum}`,
          label: `${group.grup_adi} · ${weekNum}. Hafta`,
          matches: weekMatches,
          standingsHref: getKadinlar2LigRoute("standings", group.grup_no),
        }));
    }

    // Tüm Gruplar seçili:
    // Eğer belirli bir hafta seçildiyse: Gruplara göre listele (1. Grup · X. Hafta...)
    if (selectedWeek !== "all") {
      const map = new Map<number, Kadinlar2LigMatch[]>();
      filteredMatches.forEach((m) => {
        const g = m.grup_no || 1;
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(m);
      });
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([gNo, gMatches]) => {
          const grp = groups?.find((g) => g.grup_no === gNo);
          return {
            key: `group-${gNo}-week-${selectedWeek}`,
            label: `${grp?.grup_adi || `${gNo}. Grup`} · ${selectedWeek}. Hafta`,
            matches: gMatches,
            standingsHref: getKadinlar2LigRoute("standings", gNo),
          };
        });
    }

    // Hem Tüm Gruplar hem Tüm Haftalar seçildiyse:
    // Gruplara göre listele (1. Grup · Fikstür...)
    const map = new Map<number, Kadinlar2LigMatch[]>();
    filteredMatches.forEach((m) => {
      const g = m.grup_no || 1;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gNo, gMatches]) => {
        const grp = groups?.find((g) => g.grup_no === gNo);
        return {
          key: `group-${gNo}`,
          label: `${grp?.grup_adi || `${gNo}. Grup`} · Fikstür (${gMatches.length} Maç)`,
          matches: gMatches,
          standingsHref: getKadinlar2LigRoute("standings", gNo),
        };
      });
  }, [isAll, group, groups, filteredMatches, selectedWeek]);

  return (
    <div className="space-y-4">
      <DateNavigationRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayStr={todayIso}
        statusFilter={statusFilter === "BİTTİ" ? "finished" : statusFilter === "OYNANACAK" ? "upcoming" : statusFilter === "CANLI" ? "live" : "all"}
        onSelectStatusFilter={(status) => setStatusFilter(status === "finished" ? "BİTTİ" : status === "upcoming" ? "OYNANACAK" : status === "live" ? "CANLI" : "all")}
        counts={dateCounts}
        availableDates={fixtureDates}
      />

      {/* 1. Üst Filtre ve Kontrol Barı (Altyapı ile Birebir) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card space-y-3">
        {/* Üst Satır: Hafta Seçici & Aksiyonlar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Hafta Butonları */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Calendar size={13} className="text-ink-2" />
              <span>Hafta:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedWeek("all")}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedWeek === "all"
                  ? "bg-selected-strong text-white shadow-glow-selected font-bold"
                  : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
              }`}
            >
              Tüm Haftalar ({matches.length})
            </button>

            {weeks.map((w) => {
              const count = matches.filter((m) => m.hafta === w).length;
              const isSelected = selectedWeek === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-selected-strong text-white shadow-glow-selected font-bold"
                      : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
                  }`}
                >
                  {w}. Hafta ({count})
                </button>
              );
            })}
          </div>

          {/* Sağ Aksiyon Butonları (ICS İndir, Yazdır, Favoriler) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onToggleFavoritesOnly && (
              <button
                type="button"
                onClick={onToggleFavoritesOnly}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  showOnlyFavorites
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold border-amber-400"
                    : "bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700/80"
                }`}
                title="Sadece takip ettiğim kulüplerin maçlarını listele"
              >
                <Star
                  size={12}
                  className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"}
                />
                <span className="hidden sm:inline">Favoriler</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadSeasonIcs}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Fikstürü Apple/Google/Outlook Takvime Ekle (.ics)"
            >
              <Download size={12} className="text-ink-2" />
              <span className="hidden sm:inline">Takvime Ekle</span>
            </button>

            <PrintScheduleButton
              title="Yazdır"
            />
          </div>
        </div>

        {/* Alt Satır: Durum ve Volleybox Filtreleri */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Volleybox Filtreleri (Tümü, Skorlu, Skorsuz, Girilmedi, Değişenler) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Volleybox:
            </span>
            <div className="flex items-center rounded-xl bg-slate-900/90 p-0.5 border border-slate-700/70">
              <button
                type="button"
                onClick={() => handleVolleyboxFilterChange("all")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  volleyboxFilter === "all"
                    ? "bg-slate-800 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tümü ({volleyboxStats.total})
              </button>
              <button
                type="button"
                onClick={() => handleVolleyboxFilterChange("scored")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  volleyboxFilter === "scored"
                    ? "bg-done text-done-fg font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Skorlu ({volleyboxStats.scored})
              </button>
              <button
                type="button"
                onClick={() => handleVolleyboxFilterChange("unscored")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  volleyboxFilter === "unscored"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Skorsuz ({volleyboxStats.unscored})
              </button>
              <button
                type="button"
                onClick={() => handleVolleyboxFilterChange("unsynced")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  volleyboxFilter === "unsynced"
                    ? "bg-slate-700 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Girilmedi ({volleyboxStats.unsynced})
              </button>
              <button
                type="button"
                onClick={() => handleVolleyboxFilterChange("discrepancy")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  volleyboxFilter === "discrepancy"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : volleyboxStats.discrepancy > 0
                    ? "text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <AlertTriangle size={11} />
                <span>Değişenler ({volleyboxStats.discrepancy})</span>
              </button>
            </div>

            {/* Filtreleri Sıfırla */}
            {(volleyboxFilter !== "all" ||
              selectedWeek !== "all" ||
              statusFilter !== "all" ||
              selectedDate !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setVolleyboxFilter("all");
                  setSelectedWeek("all");
                  setStatusFilter("all");
                  setSelectedDate("all");
                }}
                className="px-2 py-1 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <RotateCcw size={11} />
                <span>Sıfırla</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Altyapı kompakt fikstür akışı */}
      {fixtureSections.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-10 text-center space-y-2 shadow-card">
          <SearchX size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">Karşılaşma Bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {showOnlyFavorites
              ? "Favori kulüplerinize ait bu kriterlere uygun karşılaşma kaydı bulunmuyor."
              : "Seçilen hafta veya filtreleme kriterlerine uygun maç bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fixtureSections.map((sec) => (
            <LeagueSection
              key={sec.key}
              leagueTitle="Kadınlar 2. Ligi"
              sectionLabel={sec.label}
              matches={sec.matches.map(convertK2MatchToMatch)}
              selectedMatchId={selectedMatchId}
              favorites={favoriteMatchIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectMatch={onSelectMatch}
              mode="fixtures"
              standingsHref={sec.standingsHref}
            />
          ))}
        </div>
      )}
    </div>
  );
};
