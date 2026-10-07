"use client";

import React from "react";
import { DateRibbon } from "@/components/DateRibbon";
import { CheckCircle2, Search, Calendar } from "lucide-react";
import { formatDateTurkish } from "@/utils/calendar";
import { FixtureTable } from "@/components/FixtureTable";
import { Match } from "@/types/fixture";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueResultsTabProps {
  displayedFinishedMatches: Match[];
  favorites: string[];
  finishedSections: { title: string; subTitle: string; matches: Match[]; }[];
  league: LeagueData;
  resultDateCounts: { [dateStr: string]: number; };
  selectedResultDate: string;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  setSelectedResultDate: React.Dispatch<React.SetStateAction<string>>;
  setTeamSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  teamSearchQuery: string;
  todayStr: string;
  toggleFavorite: (teamName: string) => void;
  uniqueResultDates: string[];
  yesterdayStr: string;
}

export function LeagueResultsTab({ displayedFinishedMatches, favorites, finishedSections, league, resultDateCounts, selectedResultDate, setSelectedMatch, setSelectedResultDate, setTeamSearchQuery, teamSearchQuery, todayStr, toggleFavorite, uniqueResultDates, yesterdayStr }: LeagueResultsTabProps) {
  return (
    <div className="space-y-4">
      {/* Flashscore Yatay Tarih Şeridi (Sonuçlar Modunda - Zümrüt Yeşili) */}
      {uniqueResultDates.length > 0 && (
        <DateRibbon
          dates={uniqueResultDates}
          selectedDate={selectedResultDate}
          onSelectDate={setSelectedResultDate}
          dateCounts={resultDateCounts}
          todayStr={todayStr}
          yesterdayStr={yesterdayStr}
          variant="emerald"
        />
      )}

      {/* Arama ve Bilgi Kontrol Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <h2 className="text-sm font-bold text-white">
            Oynanan Maç Sonuçları ({displayedFinishedMatches.length})
          </h2>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Takım veya salon ara..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Seçilen Tarihin Sonuçları Bilgi ve Kolay Geçiş Rozeti */}
      {selectedResultDate !== "all" && (
        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-emerald-400 shrink-0" />
            <span>
              <strong>
                {selectedResultDate === yesterdayStr
                  ? "Dünün Sonuçları:"
                  : `${formatDateTurkish(selectedResultDate)} Sonuçları:`}
              </strong>{" "}
              {formatDateTurkish(selectedResultDate)}
            </span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
              {displayedFinishedMatches.length} Maç
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedResultDate("all")}
            className="text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Tüm Sonuçları Göster ({league.stats.finishedMatches})
          </button>
        </div>
      )}

      {finishedSections.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
          {selectedResultDate !== "all"
            ? `${formatDateTurkish(selectedResultDate)} tarihinde sonuçlanan maç bulunmuyor.`
            : teamSearchQuery
            ? "Aramanıza uygun tamamlanan maç bulunamadı."
            : "Henüz tamamlanmış maç skoru bulunmuyor."}
        </div>
      ) : (
        <div className="space-y-4">
          {finishedSections.map((sec, idx) => (
            <FixtureTable
              key={`${sec.title}-${sec.subTitle}-${idx}`}
              title={sec.title}
              subTitle={sec.subTitle}
              matches={sec.matches}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              city={league.city}
              showCityBadge={false}
              onSelectMatch={setSelectedMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
