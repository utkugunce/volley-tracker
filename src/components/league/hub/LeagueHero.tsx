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
    <section className="bg-surface border-b border-line py-5 sm:py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Rozetler Satırı */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-md bg-surface-muted text-ink-2 border border-line">
            <MapPin size={12} className="text-primary" />
            <span>{league.city} TVF İl Temsilciliği</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-md bg-surface-muted text-ink border border-line">
            <Trophy size={12} className="text-primary" />
            <span>{league.category}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md bg-surface-muted text-ink-2 border border-line">
            <Users size={12} className="text-ink-3" />
            <span>{league.ageGroup}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md bg-surface-muted text-ink-3 border border-line">
            <Calendar size={12} />
            <span>{league.season} Sezonu</span>
          </span>

          {league.volleyboxMapping?.volleybox_url && (
            <a
              href={league.volleyboxMapping.volleybox_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-colors"
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-ink tracking-tight">
              {league.leagueName}
            </h1>
            <p className="text-xs sm:text-sm text-ink-3 mt-1 max-w-2xl">
              {league.city} ili {league.category} ligi canlı puan durumu, haftalık maç fikstürleri, kesinleşmiş set skorları ve detaylı takım istatistikleri.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {league.matches.length > 0 && (
              <button
                onClick={handleDownloadCalendar}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-fg px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                title="Tüm lig fikstürünü takviminize (.ics) indirin"
              >
                <Download size={13} />
                <span>Sezonu Takvime Ekle</span>
              </button>
            )}

            {league.groups.length > 0 && (
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                title="Puan durumunu CSV olarak indirin"
              >
                <FileSpreadsheet size={13} className="text-done" />
                <span>Puan Durumu İndir (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI İstatistik Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Toplam Maç
            </span>
            <span className="text-lg sm:text-xl font-black text-ink font-mono mt-0.5 block tabular-nums">
              {league.stats.totalMatches}
            </span>
            <span className="text-[10px] text-ink-3">Planlanan Fikstür</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Tamamlanan
            </span>
            <span className="text-lg sm:text-xl font-black text-done font-mono mt-0.5 block tabular-nums">
              {league.stats.finishedMatches}
            </span>
            <span className="text-[10px] text-ink-3">%{progressPercent} İlerleme</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Gelecek Maç
            </span>
            <span className="text-lg sm:text-xl font-black text-ink font-mono mt-0.5 block tabular-nums">
              {league.stats.upcomingMatches}
            </span>
            <span className="text-[10px] text-ink-3">Oynanacak Maç</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Katılan Takım
            </span>
            <span className="text-lg sm:text-xl font-black text-ink font-mono mt-0.5 block tabular-nums">
              {league.stats.totalTeams}
            </span>
            <span className="text-[10px] text-ink-3">Kulüp & Şube</span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Lider Takım
            </span>
            <span className="text-sm font-bold text-ink truncate mt-1 block" title={league.stats.leaderTeam?.name}>
              {league.stats.leaderTeam ? league.stats.leaderTeam.name : "-"}
            </span>
            <span className="text-[10px] text-primary font-mono font-bold">
              {league.stats.leaderTeam ? `${league.stats.leaderTeam.points} Puan` : ""}
            </span>
          </div>

          <div className="bg-surface-muted p-3 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
              Ortalama Set
            </span>
            <span className="text-lg sm:text-xl font-black text-ink font-mono mt-0.5 block tabular-nums">
              {league.stats.avgSetsPerMatch}
            </span>
            <span className="text-[10px] text-ink-3">{league.stats.totalSets} Toplam Set</span>
          </div>
        </div>
      </div>
    </section>
  );
}
