"use client";

import React, { useState } from "react";
import { Match } from "../types";
import { TeamLogo } from "./TeamLogo";
import { getCalendarIsoTimes } from "../utils/calendar";
import {
  Clock,
  MapPin,
  Star,
  Share2,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink
} from "lucide-react";

interface CompactMatchRowProps {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (teamName: string) => void;
}

export const CompactMatchRow: React.FC<CompactMatchRowProps> = ({
  match,
  isFavorite,
  onToggleFavorite,
}) => {
  const [showOfficials, setShowOfficials] = useState(false);
  const [copied, setCopied] = useState(false);

  // Google Calendar URL
  const title = encodeURIComponent(`${match.league_name}: ${match.home_team} - ${match.away_team}`);
  const details = encodeURIComponent(
    `TVF Kadın Ligleri Karşılaşması\nKategori: ${match.league_name} (Grup ${match.group || "-"})\nSalon: ${match.venue}\nBaşhakem: ${match.officials.referee_1 || "-"}`
  );
  const location = encodeURIComponent(`${match.venue}, ${match.city}`);
  const { startIso, endIso } = getCalendarIsoTimes(match.date, match.time);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;

  const handleShare = async () => {
    const text = `🏐 *${match.league_name}*\n${match.home_team} vs ${match.away_team}\n📅 ${match.date_formatted} - ⏰ ${match.time}\n📍 ${match.venue} (${match.city})`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue + " " + match.city)}`;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isFavorite
          ? "bg-amber-950/20 border-amber-500/60 shadow-glow"
          : "bg-court-panel/90 border-court-border/80 hover:border-slate-600 hover:bg-court-hover"
      }`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        
        {/* Sol Kolon: Saat, Lig Kodu & Durum */}
        <div className="flex items-center gap-2.5 shrink-0 sm:w-36">
          <button
            type="button"
            onClick={() => onToggleFavorite(match.home_team)}
            className={`p-1 rounded-md transition-colors ${
              isFavorite
                ? "text-amber-400 bg-amber-500/20"
                : "text-slate-600 hover:text-amber-400"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>

          <div className="flex items-center gap-1 font-mono font-bold text-white text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
            <span>{match.time || "18:00"}</span>
          </div>

          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
            {match.league_code}
          </span>
        </div>

        {/* Orta Kolon: Takımlar (Sofascore Tarzı Alt Alta İki Takım) */}
        <div className="flex-1 space-y-1.5 py-0.5 sm:border-l sm:border-r border-court-border/60 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo name={match.home_team} size="sm" />
              <span className={`font-bold text-sm truncate max-w-[200px] sm:max-w-[280px] ${
                isFavorite ? "text-amber-300 font-black" : "text-white"
              }`}>
                {match.home_team}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold pr-2">Ev</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo name={match.away_team} size="sm" />
              <span className={`font-bold text-sm truncate max-w-[200px] sm:max-w-[280px] ${
                isFavorite ? "text-amber-300 font-black" : "text-slate-200"
              }`}>
                {match.away_team}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold pr-2">Dep</span>
          </div>
        </div>

        {/* Sağ Kolon: Salon, Grup ve Hızlı Aksiyonlar */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          
          {/* Salon Adı */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-brand-400 max-w-[150px] sm:max-w-[180px] truncate"
            title={match.venue}
          >
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate font-medium text-[11px]">{match.venue}</span>
          </a>

          {/* Grup Rozeti */}
          {match.group && (
            <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              Gr. {match.group}
            </span>
          )}

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-1.5">
            {/* Hakemler */}
            <button
              type="button"
              onClick={() => setShowOfficials(!showOfficials)}
              className="p-1.5 rounded-lg bg-court-card text-slate-400 hover:text-white border border-court-border"
              title="Hakem Kadrosu"
            >
              <UserCheck className="w-3.5 h-3.5 text-accent-cyan" />
            </button>

            {/* Google Takvim */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-court-card text-slate-400 hover:text-brand-300 border border-court-border"
              title="Google Takvime Ekle"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </a>

            {/* Paylaş */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-court-card text-slate-400 hover:text-white border border-court-border"
              title="Paylaş"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Açılır Hakem Detayı */}
      {showOfficials && (
        <div className="p-2.5 bg-black/40 border-t border-dashed border-court-border text-[11px] text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>Başhakem: <strong className="text-white">{match.officials.referee_1 || "-"}</strong></div>
          <div>Yrd. Hakem: <strong className="text-white">{match.officials.referee_2 || "-"}</strong></div>
          <div>Yazı Hakemi: <strong className="text-white">{match.officials.scorer || "-"}</strong></div>
          <div>S. Komiseri: <strong className="text-brand-300">{match.officials.commissioner || match.officials.supervisor || "-"}</strong></div>
        </div>
      )}
    </div>
  );
};
