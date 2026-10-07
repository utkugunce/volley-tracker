"use client";

import { MapPin, Trophy, Users, Calendar, ExternalLink, Download, FileSpreadsheet } from "lucide-react";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueHeroProps {
  handleDownloadCalendar: () => void;
  handleDownloadCsv: () => void;
  league: LeagueData;
  progressPercent: number;
}

export function LeagueHero({ handleDownloadCalendar, handleDownloadCsv, league, progressPercent }: LeagueHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-muted via-canvas to-canvas border-b border-slate-800/80 py-6 sm:py-8 px-4">
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-72 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-4">
        {/* Rozetler Satırı */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-600/40">
            <MapPin size={12} className="text-sky-400" />
            <span>{league.city} TVF İl Temsilciliği</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/40">
            <Trophy size={12} className="text-primary" />
            <span>{league.category}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <Users size={12} className="text-slate-400" />
            <span>{league.ageGroup}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/60">
            <Calendar size={12} />
            <span>{league.season} Sezonu</span>
          </span>

          {league.volleyboxMapping?.volleybox_url && (
            <a
              href={league.volleyboxMapping.volleybox_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 transition-colors shadow-xs"
              title="Volleybox Turnuva Sayfasına Git"
            >
              <span>Volleybox Turnuva Profili</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Ana Lig Başlığı ve Eylemler */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {league.leagueName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {league.city} ili {league.category} ligi canlı puan durumu, haftalık maç fikstürleri, kesinleşmiş set skorları ve detaylı takım istatistikleri.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {league.matches.length > 0 && (
              <button
                onClick={handleDownloadCalendar}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-fg px-3.5 py-2 rounded-xl shadow-glow-primary transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                title="Tüm lig fikstürünü takviminize (.ics) indirin"
              >
                <Download size={14} />
                <span>Sezonu Takvime Ekle</span>
              </button>
            )}

            {league.groups.length > 0 && (
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                title="Puan durumunu CSV olarak indirin"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span>Puan Durumu İndir (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI İstatistik Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Toplam Maç
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-mono mt-0.5 block">
              {league.stats.totalMatches}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Planlanan Fikstür</span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tamamlanan
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              {league.stats.finishedMatches}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">%{progressPercent} İlerleme</span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Gelecek Maç
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5 block">
              {league.stats.upcomingMatches}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Oynanacak Maç</span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Katılan Takım
            </span>
            <span className="text-lg sm:text-xl font-black text-sky-400 font-mono mt-0.5 block">
              {league.stats.totalTeams}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Kulüp & Şube</span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lider Takım
            </span>
            <span className="text-sm font-black text-amber-300 truncate mt-1 block" title={league.stats.leaderTeam?.name}>
              {league.stats.leaderTeam ? league.stats.leaderTeam.name : "-"}
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">
              {league.stats.leaderTeam ? `${league.stats.leaderTeam.points} Puan` : ""}
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ortalama Set
            </span>
            <span className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-0.5 block">
              {league.stats.avgSetsPerMatch}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{league.stats.totalSets} Toplam Set</span>
          </div>
        </div>
      </div>
    </section>
  );
}
