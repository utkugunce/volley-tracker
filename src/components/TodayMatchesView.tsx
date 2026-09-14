"use client";

import React, { useMemo, useState } from "react";
import { Match } from "@/types/fixture";
import { FixtureTable } from "@/components/FixtureTable";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  MapPin,
  SearchX,
  History,
  CalendarDays,
} from "lucide-react";
import { formatDateTurkish, isMatchPassed } from "@/utils/calendar";

interface TodayMatchesViewProps {
  matches: Match[];
  city?: string;
  todayStr: string;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  splitScreenMode?: boolean;
  onNavigateToFullFixtures: () => void;
}

export const TodayMatchesView: React.FC<TodayMatchesViewProps> = ({
  matches = [],
  city = "İstanbul",
  todayStr,
  favorites,
  onToggleFavorite,
  splitScreenMode = false,
  onNavigateToFullFixtures,
}) => {
  const [quickStatus, setQuickStatus] = useState<"all" | "upcoming" | "finished">("all");

  // Bugünün tüm maçları
  const todayMatches = useMemo(() => {
    return matches.filter((m) => m.date === todayStr);
  }, [matches, todayStr]);

  // Durum filtrelemesi
  const filteredTodayMatches = useMemo(() => {
    if (quickStatus === "all") return todayMatches;
    return todayMatches.filter((m) => m.status === quickStatus);
  }, [todayMatches, quickStatus]);

  // Sayılar
  const stats = useMemo(() => {
    const total = todayMatches.length;
    const upcoming = todayMatches.filter((m) => m.status === "upcoming").length;
    const finished = todayMatches.filter((m) => m.status === "finished").length;
    const scored = todayMatches.filter((m) => m.volleybox?.has_score).length;
    return { total, upcoming, finished, scored };
  }, [todayMatches]);

  // Eğer bugün maç yoksa: Sıradaki en yakın maç tarihini ve maçlarını bul
  const nextMatchDay = useMemo(() => {
    if (todayMatches.length > 0) return null;

    const futureDates = Array.from(
      new Set(
        matches
          .filter((m) => m.date && m.date !== "TBD" && m.date > todayStr)
          .map((m) => m.date)
      )
    ).sort();

    if (futureDates.length === 0) {
      // Eğer ileri tarih yoksa genel ilk tarihi bul
      const allDates = Array.from(
        new Set(matches.filter((m) => m.date && m.date !== "TBD").map((m) => m.date))
      ).sort();
      if (allDates.length > 0) {
        const d = allDates[0];
        return {
          date: d,
          matches: matches.filter((m) => m.date === d),
        };
      }
      return null;
    }

    const nextDate = futureDates[0];
    return {
      date: nextDate,
      matches: matches.filter((m) => m.date === nextDate),
    };
  }, [matches, todayMatches.length, todayStr]);

  // Eğer bugün maç yoksa: En son tamamlanmış maç gününü bul (Son Skorlar)
  const recentFinishedDay = useMemo(() => {
    if (todayMatches.length > 0) return null;

    const pastDates = Array.from(
      new Set(
        matches
          .filter((m) => m.date && m.date !== "TBD" && m.date < todayStr && m.status === "finished")
          .map((m) => m.date)
      )
    ).sort().reverse();

    if (pastDates.length === 0) return null;

    const lastDate = pastDates[0];
    return {
      date: lastDate,
      matches: matches.filter((m) => m.date === lastDate && m.status === "finished"),
    };
  }, [matches, todayMatches.length, todayStr]);

  // Bugünün maçlarını lig/bölüme göre grupla
  const groupedSections = useMemo(() => {
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        matches: Match[];
      };
    } = {};

    filteredTodayMatches.forEach((m) => {
      // Eğer Tüm İller seçiliyse başlıkta il ismini de göster
      const prefix = city === "Tüm İller" && m.city ? `${m.city} • ` : "";
      const groupKey = `${prefix}${m.category} - ${m.group}`;
      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: `${prefix}${m.category}`,
          subTitle: m.group,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    return Object.values(sections).sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", "tr")
    );
  }, [filteredTodayMatches, city]);

  // Sıradaki maç günü maçlarını grupla
  const nextGroupedSections = useMemo(() => {
    if (!nextMatchDay) return [];
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        matches: Match[];
      };
    } = {};

    nextMatchDay.matches.forEach((m) => {
      const prefix = city === "Tüm İller" && m.city ? `${m.city} • ` : "";
      const groupKey = `${prefix}${m.category} - ${m.group}`;
      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: `${prefix}${m.category}`,
          subTitle: m.group,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    return Object.values(sections).sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", "tr")
    );
  }, [nextMatchDay, city]);

  // Bugünün Türkçe tarihi
  const formattedToday = useMemo(() => {
    try {
      const parts = todayStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          weekday: "long",
        });
      }
    } catch {}
    return todayStr;
  }, [todayStr]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Günün Maçları Başlık Kartı */}
      <div className="bg-gradient-to-r from-[#0b1325] via-slate-900 to-[#0b1325] border border-slate-800 rounded-xl p-3 sm:p-4 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 uppercase tracking-wider">
                <Flame size={12} className="text-primary animate-pulse" />
                Günün Maçları
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {city === "Tüm İller" ? "Türkiye Geneli" : city}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Calendar size={18} className="text-amber-400 shrink-0" />
              <span>{formattedToday}</span>
            </h1>
          </div>

          {/* İstatistik Rozetleri */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-slate-400">Toplam:</span>
              <span className="font-mono font-bold text-white">{stats.total} Maç</span>
            </div>
            {stats.total > 0 && (
              <>
                <div className="bg-sky-950/80 px-2.5 py-1.5 rounded-lg border border-sky-800/60 flex items-center gap-1.5 text-sky-300">
                  <Clock size={12} />
                  <span>{stats.upcoming} Oynanacak</span>
                </div>
                <div className="bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 size={12} />
                  <span>{stats.finished} Bitti</span>
                </div>
              </>
            )}
            <button
              onClick={onNavigateToFullFixtures}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors ml-auto sm:ml-0"
              title="Tüm sezon takvimini ve tarih şeridini görüntüle"
            >
              <span>Tüm Fikstür</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Bugün Maç Varsa Hızlı Filtre Butonları */}
        {stats.total > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Filtrele:</span>
            <button
              onClick={() => setQuickStatus("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "all"
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Tümü ({stats.total})
            </button>
            <button
              onClick={() => setQuickStatus("upcoming")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "upcoming"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Oynanacak ({stats.upcoming})
            </button>
            <button
              onClick={() => setQuickStatus("finished")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "finished"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Bitenler ({stats.finished})
            </button>
          </div>
        )}
      </div>

      {/* 2. BUGÜNÜN MAÇLARI LİSTESİ */}
      {groupedSections.length > 0 && (
        <div className="space-y-4">
          {groupedSections.map((sec, idx) => (
            <FixtureTable
              key={idx}
              title={sec.title}
              subTitle={sec.subTitle}
              matches={sec.matches}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              city={city}
              splitScreenMode={splitScreenMode}
            />
          ))}
        </div>
      )}

      {/* 3. BUGÜN MAÇ YOKSA VEYA FİLTREDE BULUNAMADIYSA */}
      {groupedSections.length === 0 && (
        <div className="space-y-6">
          {todayMatches.length === 0 ? (
            /* Bugün Maç Yok Bilgilendirmesi */
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={22} />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Bugün ({formattedToday}) İçin Planlanmış Maç Bulunmuyor
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                TVF bülteninde {city === "Tüm İller" ? "iller genelinde" : `${city} ilinde`} bugün oynanacak karşılaşma yer almamaktadır.
              </p>
              <button
                onClick={onNavigateToFullFixtures}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-xs"
              >
                <span>Tüm Fikstür Takvimine Git</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* Filtre Sonucu Bulunamadı */
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-xs">
              <SearchX size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 mb-2">
                Seçtiğiniz duruma uygun maç bulunamadı.
              </p>
              <button
                onClick={() => setQuickStatus("all")}
                className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-md"
              >
                Filtreyi Sıfırla
              </button>
            </div>
          )}

          {/* Akıllı Yedek Görünüm 1: Sıradaki En Yakın Maç Günü */}
          {nextMatchDay && nextGroupedSections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-sky-600" />
                    <span>Sıradaki Maç Günü:</span>
                    <span className="text-primary font-black">
                      {formatDateTurkish(nextMatchDay.date)}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {nextMatchDay.matches.length} Karşılaşma
                </span>
              </div>

              <div className="space-y-4">
                {nextGroupedSections.map((sec, idx) => (
                  <FixtureTable
                    key={idx}
                    title={sec.title}
                    subTitle={sec.subTitle}
                    matches={sec.matches}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                    city={city}
                    splitScreenMode={splitScreenMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Akıllı Yedek Görünüm 2: Son Tamamlanan Karşılaşmalar */}
          {recentFinishedDay && recentFinishedDay.matches.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1 border-t border-slate-200/80 pt-4">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-slate-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Son Oynanan Maçlar:{" "}
                    <span className="text-slate-900 font-extrabold">
                      {formatDateTurkish(recentFinishedDay.date)}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {recentFinishedDay.matches.length} Sonuç
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {recentFinishedDay.matches.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {m.time}
                      </span>
                      {m.city && city === "Tüm İller" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                          {m.city}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800 truncate">
                        {m.home_team}
                      </span>
                      <span className="text-slate-400 font-bold shrink-0">vs</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {m.away_team}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.score ? (
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.score}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">- : -</span>
                      )}
                      {m.volleybox?.url && (
                        <a
                          href={m.volleybox.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0"
                          title="Volleybox'ta Görüntüle"
                        >
                          VB ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
