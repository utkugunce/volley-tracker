"use client";

import React, { useState, useMemo } from "react";
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
import { FixtureTable } from "@/components/FixtureTable";
import { convertK2MatchToMatch } from "@/utils/kadinlar2LigConverter";
import { generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { useFavorites } from "@/utils/useFavorites";
import { PrintScheduleButton } from "@/components/PrintScheduleButton";
import { isMatchOverdueForScore } from "@/utils/calendar";

interface Kadinlar2LigFixturesProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
  onSelectMatch?: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
}

export const Kadinlar2LigFixtures: React.FC<Kadinlar2LigFixturesProps> = ({
  group,
  searchQuery = "",
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OYNANACAK" | "BİTTİ">("all");
  const [volleyboxFilter, setVolleyboxFilter] = useState<
    "all" | "scored" | "unscored" | "unsynced" | "discrepancy"
  >("all");

  const matches = useMemo(() => group?.fikstur || [], [group?.fikstur]);

  // Hafta listesi
  const weeks = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => {
      if (m.hafta) set.add(m.hafta);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  // Volleybox Eşleşme İstatistikleri (Tümü, Skorlu, Skorsuz, Girilmedi, Değişenler)
  const volleyboxStats = useMemo(() => {
    const total = matches.length;
    const scored = matches.filter(
      (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -")
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
        Boolean((m as any).discrepancy?.has_diff || (m as any).volleybox?.discrepancy?.has_diff)
    ).length;

    return { total, scored, unscored, unsynced, discrepancy };
  }, [matches]);

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedWeek !== "all" && m.hafta !== selectedWeek) return false;
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
      if (showOnlyFavorites) {
        const homeFav = isFavorite(m.takim_a);
        const awayFav = isFavorite(m.takim_b);
        if (!homeFav && !awayFav) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams =
          m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
        const inCity = m.sehir?.toLowerCase().includes(q);
        const inHall = m.salon?.toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }

      // Volleybox filtreleri
      const isScored =
        m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor !== "- : -");
      const isSynced = Boolean(m.takim_a_volleybox_url && m.takim_b_volleybox_url);
      const hasDiscrepancy = Boolean(
        (m as any).discrepancy?.has_diff || (m as any).volleybox?.discrepancy?.has_diff
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
    statusFilter,
    showOnlyFavorites,
    searchQuery,
    volleyboxFilter,
    isFavorite,
  ]);

  // Haftalara göre gruplama
  const matchesByWeek = useMemo(() => {
    const map = new Map<number, Kadinlar2LigMatch[]>();
    filteredMatches.forEach((m) => {
      const w = m.hafta || 1;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMatches]);

  // Favori maç ID'leri
  const favoriteMatchIds = useMemo(() => {
    return matches
      .filter((m) => isFavorite(m.takim_a) || isFavorite(m.takim_b))
      .map((m) => m.id);
  }, [matches, isFavorite]);

  const handleToggleFavorite = (matchId: string) => {
    const found = matches.find((m) => m.id === matchId);
    if (found) {
      toggleFavorite(found.takim_a);
    }
  };

  // Sezon Takvimi İndir (.ics)
  const handleDownloadSeasonIcs = () => {
    const converted = filteredMatches.map(convertK2MatchToMatch);
    const ics = generateSeasonIcs(
      converted,
      `Kadınlar 2. Ligi ${group.grup_adi} Fikstürü`
    );
    downloadIcsFile(`kadinlar-2-ligi-${group.grup_no}-grup-fikstur.ics`, ics);
  };

  const groupCity = group?.fikstur?.[0]?.sehir || "Türkiye";

  return (
    <div className="space-y-4">
      {/* 1. Üst Filtre ve Kontrol Barı (Altyapı ile Birebir) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card space-y-3">
        {/* Üst Satır: Hafta Seçici & Aksiyonlar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Hafta Butonları */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Calendar size={13} className="text-rose-400" />
              <span>Hafta:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedWeek("all")}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedWeek === "all"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold"
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
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold"
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
              <Download size={12} className="text-rose-400" />
              <span className="hidden sm:inline">Takvime Ekle</span>
            </button>

            <PrintScheduleButton
              title="Yazdır"
            />
          </div>
        </div>

        {/* Alt Satır: Durum ve Volleybox Filtreleri */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Sol: Durum Filtresi (Tümü, Oynanacak, Bitenler) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Durum:
            </span>
            <div className="flex items-center rounded-xl bg-slate-900/90 p-0.5 border border-slate-700/70">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("OYNANACAK")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "OYNANACAK"
                    ? "bg-rose-600 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Oynanacak
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("BİTTİ")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "BİTTİ"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Bitenler
              </button>
            </div>
          </div>

          {/* Sağ: Volleybox Filtreleri (Tümü, Skorlu, Skorsuz, Girilmedi, Değişenler) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Volleybox:
            </span>
            <div className="flex items-center rounded-xl bg-slate-900/90 p-0.5 border border-slate-700/70">
              <button
                type="button"
                onClick={() => setVolleyboxFilter("all")}
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
                onClick={() => setVolleyboxFilter("scored")}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  volleyboxFilter === "scored"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Skorlu ({volleyboxStats.scored})
              </button>
              <button
                type="button"
                onClick={() => setVolleyboxFilter("unscored")}
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
                onClick={() => setVolleyboxFilter("unsynced")}
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
                onClick={() => setVolleyboxFilter("discrepancy")}
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
            {(volleyboxFilter !== "all" || selectedWeek !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setVolleyboxFilter("all");
                  setSelectedWeek("all");
                  setStatusFilter("all");
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

      {/* 2. Maç Tabloları (Altyapı FixtureTable ile Birebir) */}
      {matchesByWeek.length === 0 ? (
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
          {matchesByWeek.map(([weekNum, weekMatches]) => (
            <FixtureTable
              key={weekNum}
              title="Kadınlar 2. Ligi"
              subTitle={`${group.grup_adi} • ${weekNum}. Hafta`}
              matches={weekMatches.map(convertK2MatchToMatch)}
              favorites={favoriteMatchIds}
              onToggleFavorite={handleToggleFavorite}
              city={groupCity}
              showCityBadge={false}
              onSelectMatch={onSelectMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};
