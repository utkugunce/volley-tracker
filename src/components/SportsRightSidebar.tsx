"use client";

import React, { useState } from "react";
import rawStandings from "../data/standings.json";
import rawVenues from "../data/venues.json";
import { LeagueStandings, VenueInfo } from "../types";
import { TeamLogo } from "./TeamLogo";
import { Trophy, MapPin, Navigation, Info, ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";

interface SportsRightSidebarProps {
  onViewAllStandings: () => void;
  onViewAllVenues: () => void;
}

export const SportsRightSidebar: React.FC<SportsRightSidebarProps> = ({
  onViewAllStandings,
  onViewAllVenues,
}) => {
  const standings = rawStandings as LeagueStandings[];
  const venues = rawVenues as VenueInfo[];
  const [selectedLeagueIndex, setSelectedLeagueIndex] = useState(0);

  const currentLeague = standings[selectedLeagueIndex] || standings[0];
  const featuredVenue = venues[0]; // 50. Yıl Deniz Esinduy

  return (
    <aside className="w-full lg:w-80 space-y-4 shrink-0">
      
      {/* 1. Canlı Puan Durumu Widget'ı */}
      <div className="rounded-2xl p-4 bg-[#0f172a] border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Puan Durumu
            </h3>
          </div>
          <button
            onClick={onViewAllStandings}
            className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            Tümü <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Lig Sekmeleri */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {standings.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setSelectedLeagueIndex(i)}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedLeagueIndex === i
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {l.category} {l.group ? `Gr.${l.group}` : l.city}
            </button>
          ))}
        </div>

        {/* Mini Tablo */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider px-2 py-1">
            <span># Takım</span>
            <div className="flex items-center gap-3">
              <span className="w-4 text-center">O</span>
              <span className="w-5 text-center text-amber-400">P</span>
              <span className="w-12 text-center">Form</span>
            </div>
          </div>

          {currentLeague?.table.slice(0, 5).map((row) => (
            <div
              key={row.team}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-850 bg-slate-900/40 text-xs transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-4 text-[11px] font-black text-center ${
                    row.rank <= 2 ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {row.rank}
                </span>
                <TeamLogo name={row.team} size="xs" />
                <span className="font-bold text-slate-200 truncate max-w-[110px]">
                  {row.team}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                <span className="w-4 text-center text-slate-400 font-medium">{row.played}</span>
                <span className="w-5 text-center font-black text-amber-400">{row.points}</span>
                <div className="flex items-center gap-0.5 w-12 justify-center">
                  {row.form.map((f, idx) => (
                    <span
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                        f === "W"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Günün Salonu Rehberi Widget'ı */}
      {featuredVenue && (
        <div className="rounded-2xl p-4 bg-[#0f172a] border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Günün Salonu
              </h3>
            </div>
            <button
              onClick={onViewAllVenues}
              className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              9 Salon <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 truncate">
                {featuredVenue.name}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                {featuredVenue.district}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2">
              {featuredVenue.transit_info}
            </p>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(featuredVenue.maps_query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Haritada Yol Tarifi</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 3. Resmi TVF Bülten Notları */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-[#0f172a] border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 text-brand-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Resmi TVF Bülten Notu</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Tüm Gelişim Ligi müsabakaları 3 set olarak oynatılacaktır. Kulüplerimizin ve hakemlerimizin resmi bülten saatlerine riayet etmeleri rica olunur.
        </p>
      </div>

    </aside>
  );
};
