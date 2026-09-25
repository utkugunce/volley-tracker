"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, Star, History, SearchX, RotateCcw } from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { FixtureTable } from "@/components/FixtureTable";
import { DateRibbon } from "@/components/DateRibbon";
import { convertK2MatchToMatch } from "@/utils/kadinlar2LigConverter";
import { useFavorites } from "@/utils/useFavorites";

interface Kadinlar2LigResultsProps {
  allMatches: Kadinlar2LigMatch[];
  groups: Kadinlar2LigGroup[];
  onSelectMatch: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  searchQuery?: string;
}

export const Kadinlar2LigResults: React.FC<Kadinlar2LigResultsProps> = ({
  allMatches,
  groups,
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  searchQuery = "",
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");
  const [selectedResultDate, setSelectedResultDate] = useState<string>("all");

  // Bugün ve Dün Tarihleri (ISO format: YYYY-MM-DD)
  const { todayIso, yesterdayIso } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;

    return { todayIso: today, yesterdayIso: yesterday };
  }, []);

  // Yalnızca sonuçlanan veya skoru olan maçlar
  const finishedMatches = useMemo(() => {
    return allMatches.filter(
      (m) =>
        m.durum === "BİTTİ" ||
        (m.skor && m.skor.includes("-") && m.skor.trim() !== "-" && m.skor !== "- : -")
    );
  }, [allMatches]);

  // Sonuçlanan maçların benzersiz tarihleri (YYYY-MM-DD)
  const uniqueResultDates = useMemo(() => {
    const set = new Set<string>();
    finishedMatches.forEach((m) => {
      const match = convertK2MatchToMatch(m);
      if (match.date && match.date !== "TBD") {
        set.add(match.date);
      }
    });
    return Array.from(set).sort().reverse();
  }, [finishedMatches]);

  // Tarih bazlı maç sayıları
  const resultDateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    finishedMatches.forEach((m) => {
      const match = convertK2MatchToMatch(m);
      if (match.date && match.date !== "TBD") {
        counts[match.date] = (counts[match.date] || 0) + 1;
      }
    });
    return counts;
  }, [finishedMatches]);

  // Filtrelenmiş sonuçlar
  const filteredResults = useMemo(() => {
    return finishedMatches.filter((m) => {
      const match = convertK2MatchToMatch(m);

      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      if (selectedResultDate !== "all" && match.date !== selectedResultDate) return false;

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

      return true;
    });
  }, [
    finishedMatches,
    selectedGroupFilter,
    selectedResultDate,
    showOnlyFavorites,
    searchQuery,
    isFavorite,
  ]);

  // Gruplara göre bölümlendirme
  const resultsByGroup = useMemo(() => {
    const map = new Map<number, Kadinlar2LigMatch[]>();
    filteredResults.forEach((m) => {
      const gNo = m.grup_no || 1;
      if (!map.has(gNo)) map.set(gNo, []);
      map.get(gNo)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredResults]);

  // Favori maç ID'leri
  const favoriteMatchIds = useMemo(() => {
    return finishedMatches
      .filter((m) => isFavorite(m.takim_a) || isFavorite(m.takim_b))
      .map((m) => m.id);
  }, [finishedMatches, isFavorite]);

  const handleToggleFavorite = (matchId: string) => {
    const found = finishedMatches.find((m) => m.id === matchId);
    if (found) {
      toggleFavorite(found.takim_a);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Tarih Şeridi (Altyapı Sonuçlar ile Birebir - Zümrüt Yeşili Temalı) */}
      <DateRibbon
        dates={uniqueResultDates}
        selectedDate={selectedResultDate}
        onSelectDate={setSelectedResultDate}
        dateCounts={resultDateCounts}
        todayStr={todayIso}
        yesterdayStr={yesterdayIso}
        variant="emerald"
      />

      {/* 2. Üst Kontrol ve Filtre Barı */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
              Tamamlanan Maç Sonuçları
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Toplam {finishedMatches.length} sonuçlanan karşılaşma
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Grup Seçici */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Grup:
            </span>
            <select
              value={selectedGroupFilter}
              onChange={(e) =>
                setSelectedGroupFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
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

          {/* Favoriler Butonu */}
          {onToggleFavoritesOnly && (
            <button
              type="button"
              onClick={onToggleFavoritesOnly}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showOnlyFavorites
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold border-amber-400"
                  : "bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700/80"
              }`}
              title="Sadece takip ettiğim kulüplerin sonuçlarını listele"
            >
              <Star
                size={12}
                className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"}
              />
              <span className="hidden sm:inline">Favoriler</span>
            </button>
          )}

          {/* Filtreleri Sıfırla Butonu */}
          {(selectedGroupFilter !== "all" || selectedResultDate !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSelectedGroupFilter("all");
                setSelectedResultDate("all");
              }}
              className="px-2.5 py-1 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <RotateCcw size={11} />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Sonuç Tabloları (Altyapı FixtureTable ile Birebir) */}
      {resultsByGroup.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-10 text-center space-y-3 shadow-card max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-emerald-400 border border-slate-700">
            {selectedResultDate === yesterdayIso ? (
              <History size={22} />
            ) : (
              <SearchX size={22} />
            )}
          </div>
          <h3 className="text-sm font-bold text-white">
            {selectedResultDate === yesterdayIso
              ? "Dün Oynanan Maç Sonucu Bulunmuyor"
              : "Sonuçlanan Karşılaşma Bulunamadı"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {showOnlyFavorites
              ? "Favori kulüplerinize ait sonuçlanmış maç kaydı henüz girilmedi."
              : "Seçili tarih veya grup kriterine uygun tamamlanmış karşılaşma bulunmuyor. Önceki tüm maç sonuçlarını görmek için Tüm Sonuçlar seçeneğini kullanabilirsiniz."}
          </p>
          {selectedResultDate !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedResultDate("all")}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Tüm Sonuçları Göster</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {resultsByGroup.map(([gNo, groupMatches]) => {
            const grp = groups.find((g) => g.grup_no === gNo);
            const title = "Kadınlar 2. Ligi";
            const subTitle = `${grp?.grup_adi || `${gNo}. Grup`} • Maç Sonuçları`;
            const city = groupMatches[0]?.sehir || "Türkiye";

            return (
              <FixtureTable
                key={gNo}
                title={title}
                subTitle={subTitle}
                matches={groupMatches.map(convertK2MatchToMatch)}
                favorites={favoriteMatchIds}
                onToggleFavorite={handleToggleFavorite}
                city={city}
                showCityBadge={true}
                onSelectMatch={onSelectMatch}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
