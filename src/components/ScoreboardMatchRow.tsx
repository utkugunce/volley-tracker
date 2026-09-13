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
  ExternalLink,
  Download,
  Info
} from "lucide-react";

interface ScoreboardMatchRowProps {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (teamName: string) => void;
}

export const ScoreboardMatchRow: React.FC<ScoreboardMatchRowProps> = ({
  match,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Google Calendar URL
  const title = encodeURIComponent(`${match.league_name}: ${match.home_team} - ${match.away_team}`);
  const details = encodeURIComponent(
    `TVF Kadın Ligleri Karşılaşması\nKategori: ${match.league_name} (Grup ${match.group || "-"})\nSalon: ${match.venue}\nBaşhakem: ${match.officials.referee_1 || "-"}`
  );
  const location = encodeURIComponent(`${match.venue}, ${match.city}`);
  const { startIso, endIso } = getCalendarIsoTimes(match.date, match.time);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;

  // iCal (.ics) dosyası indir
  const downloadIcsFile = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TVF Score Center//TR",
      "BEGIN:VEVENT",
      `SUMMARY:${match.league_name}: ${match.home_team} - ${match.away_team}`,
      `DESCRIPTION:Kategori: ${match.league_name} | Salon: ${match.venue}`,
      `LOCATION:${match.venue}, ${match.city}`,
      `DTSTART:${startIso}`,
      `STATUS:CONFIRMED`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${match.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      className={`border transition-all duration-150 rounded-xl overflow-hidden ${
        isFavorite
          ? "bg-[#161d2d] border-amber-500/50 shadow-md shadow-amber-500/5"
          : "bg-[#0f172a]/95 border-slate-800 hover:border-slate-700 hover:bg-[#131d33]"
      }`}
    >
      {/* Ana Satır (Sofascore & Flashscore Tarzı) */}
      <div className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-xs">
        
        {/* 1. Sol: Zaman, Durum ve Yıldız */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:w-28">
          <button
            type="button"
            onClick={() => onToggleFavorite(match.home_team)}
            className={`p-1 rounded-md transition-colors ${
              isFavorite
                ? "text-amber-400 bg-amber-500/20"
                : "text-slate-600 hover:text-amber-400 hover:bg-slate-800"
            }`}
            title={isFavorite ? "Favorilerden Çıkar" : "Takımı Favorilere Ekle"}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>

          <div>
            <span className="font-mono text-sm font-black text-white block leading-tight">
              {match.time || "18:00"}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider block uppercase">
              Programda
            </span>
          </div>
        </div>

        {/* 2. Orta: İki Takım (Sofascore Alt Alta Maç Düzeni) */}
        <div className="flex-1 min-w-0 border-l border-slate-800/80 pl-3 sm:pl-4 space-y-1.5">
          {/* Ev Sahibi */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo name={match.home_team} size="sm" />
              <span className={`text-sm font-bold truncate transition-colors ${
                isFavorite && match.home_team
                  ? "text-amber-300 font-black"
                  : "text-slate-100 group-hover:text-brand-300"
              }`}>
                {match.home_team}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono shrink-0 pl-2">
              <span className="w-5 text-center font-bold text-slate-400">-</span>
            </div>
          </div>

          {/* Deplasman */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo name={match.away_team} size="sm" />
              <span className={`text-sm font-bold truncate transition-colors ${
                isFavorite && match.away_team
                  ? "text-amber-300 font-black"
                  : "text-slate-200 group-hover:text-brand-300"
              }`}>
                {match.away_team}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono shrink-0 pl-2">
              <span className="w-5 text-center font-bold text-slate-400">-</span>
            </div>
          </div>
        </div>

        {/* 3. Sağ: Set Tablosu Başlıkları (Flashscore Skor Izgarası) */}
        <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-800/80 pl-4 shrink-0 font-mono text-[11px] text-slate-400">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase text-slate-500">S1</span>
            <span className="w-6 text-center font-bold text-slate-600">-</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase text-slate-500">S2</span>
            <span className="w-6 text-center font-bold text-slate-600">-</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase text-slate-500">S3</span>
            <span className="w-6 text-center font-bold text-slate-600">-</span>
          </div>
          <div className="flex flex-col items-center bg-slate-800/50 px-1 rounded">
            <span className="text-[9px] uppercase font-bold text-brand-400">TOP</span>
            <span className="w-6 text-center font-bold text-slate-400">-</span>
          </div>
        </div>

        {/* 4. Sağ: Salon, Grup ve Detay Aç/Kapa */}
        <div className="flex items-center gap-2 shrink-0 border-l border-slate-800/80 pl-3">
          {/* Salon Adı */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-brand-400 text-xs max-w-[140px] truncate"
            title={match.venue}
          >
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </a>

          {/* Grup Etiketi */}
          {match.group && (
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
              Gr. {match.group}
            </span>
          )}

          {/* Detay Aç Butonu */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg border transition-all ${
              isExpanded
                ? "bg-brand-500 text-white border-brand-400"
                : "bg-slate-800/80 text-slate-400 hover:text-white border-slate-700"
            }`}
            title="Maç Detayları & Hakemler"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Genişletilmiş Spor Paneli (Hakem Kadrosu, Yol Tarifi ve Takvim) */}
      {isExpanded && (
        <div className="bg-[#0b1120] border-t border-slate-800 p-3.5 sm:p-4 text-xs space-y-3 animate-in fade-in">
          
          {/* Hakemler Izgarası */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Başhakem</span>
              <span className="font-bold text-slate-200">{match.officials.referee_1 || "Atama Bekleniyor"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Yardımcı Hakem</span>
              <span className="font-bold text-slate-200">{match.officials.referee_2 || "Atama Bekleniyor"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Yazı / Skor Hakemi</span>
              <span className="font-bold text-slate-200">{match.officials.scorer || match.officials.assistant_scorer || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Salon Komiseri</span>
              <span className="font-bold text-amber-400">{match.officials.commissioner || match.officials.supervisor || "Gözlemci"}</span>
            </div>
          </div>

          {/* Hızlı Butonlar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-white font-medium">{match.venue} ({match.city})</span>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline flex items-center gap-1 font-semibold ml-1"
              >
                Yol Tarifi <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Takvim</span>
              </a>

              <button
                type="button"
                onClick={downloadIcsFile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                title="iCal (.ics) İndir"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-accent-cyan" />}
                <span>{copied ? "Kopyalandı" : "WhatsApp Paylaş"}</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
