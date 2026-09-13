"use client";

import React from "react";
import { Match } from "../types";
import { TeamLogo } from "./TeamLogo";
import { getCalendarIsoTimes } from "../utils/calendar";
import { Calendar, Clock, MapPin, Share2, Sparkles, Trophy, ExternalLink } from "lucide-react";

interface FeaturedMatchProps {
  match?: Match;
}

export const FeaturedMatch: React.FC<FeaturedMatchProps> = ({ match }) => {
  if (!match) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue + " " + match.city)}`;
  const title = encodeURIComponent(`${match.league_name}: ${match.home_team} - ${match.away_team}`);
  const details = encodeURIComponent(
    `TVF Kadın Ligleri Haftanın Maçı\nKategori: ${match.league_name} (Grup ${match.group || "-"})\nSalon: ${match.venue}`
  );
  const location = encodeURIComponent(`${match.venue}, ${match.city}`);
  const { startIso, endIso } = getCalendarIsoTimes(match.date, match.time);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-court-card via-court-panel to-[#141b2b] border border-brand-500/40 shadow-2xl">
      
      {/* Voleybol Arka Plan Görsel Vurgusu */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />

      {/* Üst Kısım: Rozet & Kategori */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-glow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Haftanın Öne Çıkan Maçı</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {match.league_name} • Grup {match.group || "A"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping" />
          <span>{match.city} Yerel Ligi</span>
        </div>
      </div>

      {/* Orta Kısım: Büyük Takım Karşılaşması */}
      <div className="grid grid-cols-1 lg:grid-cols-7 items-center gap-6 my-2 relative z-10">
        
        {/* Ev Sahibi */}
        <div className="lg:col-span-3 flex items-center gap-4">
          <TeamLogo name={match.home_team} size="lg" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-widest font-black text-brand-400 block mb-0.5">
              Ev Sahibi Kulüp
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-none truncate">
              {match.home_team}
            </h2>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Kadın Voleybol Takımı</span>
          </div>
        </div>

        {/* Skor / VS & Zaman Merkezi */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="px-4 py-2 rounded-2xl bg-court-dark/90 border border-brand-500/40 text-brand-400 font-black text-xl sm:text-2xl shadow-glow tracking-wider">
            {match.time || "18:00"}
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {match.date_formatted}
          </span>
        </div>

        {/* Deplasman */}
        <div className="lg:col-span-3 flex items-center lg:justify-end gap-4 lg:text-right">
          <div className="min-w-0 order-2 lg:order-1">
            <span className="text-[11px] uppercase tracking-widest font-black text-accent-cyan block mb-0.5">
              Deplasman Kulübü
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-none truncate">
              {match.away_team}
            </h2>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Kadın Voleybol Takımı</span>
          </div>
          <div className="order-1 lg:order-2">
            <TeamLogo name={match.away_team} size="lg" />
          </div>
        </div>

      </div>

      {/* Alt Kısım: Salon ve Aksiyon Butonları */}
      <div className="mt-8 pt-5 border-t border-court-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        
        {/* Salon Bilgisi */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-brand-300 transition-colors group"
        >
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:bg-brand-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">{match.venue}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              Haritada Görüntüle ve Yol Tarifi Al <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </a>

        {/* Hızlı Aksiyonlar */}
        <div className="flex items-center gap-2.5">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs sm:text-sm shadow-glow flex items-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Google Takvime Ekle</span>
          </a>
        </div>

      </div>

    </div>
  );
};
