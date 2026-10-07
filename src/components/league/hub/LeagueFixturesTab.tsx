"use client";

import React from "react";
import { DateRibbon } from "@/components/DateRibbon";
import { Calendar, Search } from "lucide-react";
import { formatDateTurkish } from "@/utils/calendar";
import { FixtureTable } from "@/components/FixtureTable";
import { Match } from "@/types/fixture";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueFixturesTabProps {
  displayedUpcomingMatches: Match[];
  favorites: string[];
  fixtureDateCounts: { [dateStr: string]: number; };
  league: LeagueData;
  selectedFixtureDate: string;
  setSelectedFixtureDate: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  setTeamSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  teamSearchQuery: string;
  todayStr: string;
  toggleFavorite: (teamName: string) => void;
  uniqueFixtureDates: string[];
  upcomingSections: { title: string; subTitle: string; matches: Match[]; }[];
  yesterdayStr: string;
}

export function LeagueFixturesTab({ displayedUpcomingMatches, favorites, fixtureDateCounts, league, selectedFixtureDate, setSelectedFixtureDate, setSelectedMatch, setTeamSearchQuery, teamSearchQuery, todayStr, toggleFavorite, uniqueFixtureDates, upcomingSections, yesterdayStr }: LeagueFixturesTabProps) {
  return (
    <div className="space-y-4">
      {/* Flashscore Yatay Tarih Şeridi (Fikstür Modunda) */}
      {uniqueFixtureDates.length > 0 && (
        <DateRibbon
          dates={uniqueFixtureDates}
          selectedDate={selectedFixtureDate}
          onSelectDate={setSelectedFixtureDate}
          dateCounts={fixtureDateCounts}
          todayStr={todayStr}
          yesterdayStr={yesterdayStr}
          variant="red"
        />
      )}

      {/* Arama ve Bilgi Kontrol Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-ink-2" />
          <h2 className="text-sm font-bold text-white">
            Fikstür & Maç Programı ({displayedUpcomingMatches.length})
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

      {/* Seçilen Tarihin Maçları Bilgi ve Kolay Geçiş Rozeti */}
      {selectedFixtureDate !== "all" && (
        <div className="flex items-center justify-between bg-sky-950/40 border border-sky-800/60 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-sky-400 shrink-0" />
            <span>
              <strong>Seçilen Tarih:</strong> {formatDateTurkish(selectedFixtureDate)}
            </span>
            <span className="text-[11px] bg-sky-500/20 text-sky-200 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
              {displayedUpcomingMatches.length} Maç
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFixtureDate("all")}
            className="text-xs text-sky-400 hover:text-sky-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Tüm Fikstürü Göster ({league.stats.upcomingMatches})
          </button>
        </div>
      )}

      {upcomingSections.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
          {selectedFixtureDate !== "all"
            ? `${formatDateTurkish(selectedFixtureDate)} tarihinde oynanacak maç bulunmuyor.`
            : teamSearchQuery
            ? "Aramanıza uygun gelecek maç bulunamadı."
            : "Planlanmış gelecek maç bulunamadı."}
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingSections.map((sec, idx) => (
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
