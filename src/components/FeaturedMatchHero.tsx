"use client";

import React, { useState, useEffect } from "react";
import { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { MapPin, Calendar, Clock, Star, CalendarPlus, ExternalLink, Flame, Trophy, Navigation, Copy, Check } from "lucide-react";
import { getHallNavigationUrl } from "@/utils/halls";
import { generateMatchIcs, downloadIcsFile } from "@/utils/ics";

interface FeaturedMatchHeroProps {
  matches: Match[];
  city?: string;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onSelectMatch?: (match: Match) => void;
}

export const FeaturedMatchHero: React.FC<FeaturedMatchHeroProps> = ({
  matches,
  city = "İstanbul",
  favorites = [],
  onToggleFavorite,
  onSelectMatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // En uygun öne çıkan maçı seç:
  // 1. Önce favori olup henüz oynanmamış ilk maç
  // 2. Henüz oynanmamış en yakın tarihli maç
  // 3. Hiçbiri yoksa en son tamamlanan maç
  const featuredMatch = React.useMemo(() => {
    if (!matches || matches.length === 0) return null;

    const validMatches = matches.filter((m) => m.date && m.date !== "TBD");
    if (validMatches.length === 0) return matches[0];

    // Favori ve yaklaşan maç
    const favUpcoming = validMatches.find(
      (m) => favorites.includes(m.id) && m.status !== "finished"
    );
    if (favUpcoming) return favUpcoming;

    // Yaklaşan ilk maç
    const upcoming = validMatches.find((m) => m.status !== "finished");
    if (upcoming) return upcoming;

    // Tamamlanan son maç
    return validMatches[validMatches.length - 1];
  }, [matches, favorites]);

  // Geri sayım sayacı
  useEffect(() => {
    if (!featuredMatch || featuredMatch.status === "finished" || !featuredMatch.date || featuredMatch.date === "TBD") {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      try {
        const timeStr = featuredMatch.time && featuredMatch.time !== "--:--" ? featuredMatch.time : "12:00";
        const matchDateTime = new Date(`${featuredMatch.date}T${timeStr}:00`);
        const now = new Date();
        const diff = matchDateTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft(null);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setTimeLeft({ days, hours, minutes, seconds });
        }
      } catch {
        setTimeLeft(null);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [featuredMatch]);

  if (!featuredMatch) return null;

  const isFav = favorites.includes(featuredMatch.id);
  const isFinished = featuredMatch.status === "finished";
  const homeWon = isFinished && (featuredMatch.home_score ?? 0) > (featuredMatch.away_score ?? 0);
  const awayWon = isFinished && (featuredMatch.away_score ?? 0) > (featuredMatch.home_score ?? 0);

  const formatDateStr = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") return "Tarih Açıklanacak";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  };

  const handleDownloadIcs = () => {
    if (!featuredMatch.date || featuredMatch.date === "TBD") return;
    const ics = generateMatchIcs(featuredMatch);
    if (ics) {
      downloadIcsFile(`mac-${featuredMatch.home_team}-${featuredMatch.away_team}.ics`, ics);
    }
  };

  const handleCopy = () => {
    const text = `TVF ${featuredMatch.city || city} ${featuredMatch.category} (${featuredMatch.group}):\n${featuredMatch.home_team} vs ${featuredMatch.away_team}\n🗓 ${featuredMatch.date} ${featuredMatch.time}\n📍 ${featuredMatch.hall}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl border border-red-500/25 bg-gradient-to-br from-slate-900/95 via-[#0b1220]/95 to-slate-950 p-5 sm:p-7 overflow-hidden shadow-2xl transition-all duration-300 mb-6 group">
      {/* Voleybol Sahası Arka Plan Çizgileri Deseni (SVG Neon Court Overlay) */}
      <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="court-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#ef4444" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#court-grid)" />
        </svg>
      </div>

      {/* Ambient Radial Işıma Efektleri */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-500" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Üst Başlık Barı: Kategori, Grup, Durum & Sayaç */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600/20 text-red-400 border border-red-500/30 shadow-xs">
            <Flame size={13} className="text-red-400 animate-pulse" />
            <span>ÖNE ÇIKAN MAÇ</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {featuredMatch.category} • {featuredMatch.group}
          </span>
        </div>

        {/* Geri Sayım / Durum Rozeti */}
        <div>
          {isFinished ? (
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Trophy size={12} />
              <span>Maç Tamamlandı</span>
            </span>
          ) : timeLeft ? (
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full shadow-xs">
              <Clock size={12} className="text-amber-400 animate-spin-slow" />
              <span>
                {timeLeft.days > 0 ? `${timeLeft.days} gün ` : ""}
                {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")} kaldı
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-full">
              <Calendar size={12} />
              <span>{formatDateStr(featuredMatch.date)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Ana Eşleşme Vitrini (Büyük Logolar & Karşılaşma) */}
      <div className="relative z-10 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        {/* Ev Sahibi Takım */}
        <div className={`flex flex-col items-center md:items-start text-center md:text-left flex-1 transition-all ${
          homeWon ? "scale-105" : ""
        }`}>
          <div className="flex flex-col items-center md:items-start gap-2">
            <TeamVolleyboxLink
              teamName={featuredMatch.home_team}
              category={featuredMatch.category || featuredMatch.age_group}
              city={featuredMatch.city || city}
              logoClassName="!w-16 !h-16 sm:!w-20 sm:!h-20 object-contain drop-shadow-2xl bg-transparent transition-transform hover:scale-110"
              className={`text-base sm:text-xl md:text-2xl transition-colors ${
                homeWon
                  ? "font-black text-white drop-shadow-glow"
                  : isFinished
                  ? "font-semibold text-slate-400"
                  : "font-black text-slate-100 hover:text-white"
              }`}
            />
            {homeWon && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                <Trophy size={11} /> KAZANDI
              </span>
            )}
          </div>
        </div>

        {/* Orta Alan: Skor / VS & Saat */}
        <div className="flex flex-col items-center justify-center shrink-0 px-4">
          {isFinished ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-3xl sm:text-4xl font-mono font-black ${homeWon ? "text-white" : "text-slate-400"}`}>
                  {featuredMatch.home_score ?? 0}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-slate-600">-</span>
                <span className={`text-3xl sm:text-4xl font-mono font-black ${awayWon ? "text-white" : "text-slate-400"}`}>
                  {featuredMatch.away_score ?? 0}
                </span>
              </div>
              {featuredMatch.set_scores && featuredMatch.set_scores.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  {featuredMatch.set_scores.map((set, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-950/80 text-slate-300 border border-slate-800"
                    >
                      {set}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-sm shadow-glow-red tracking-wider">
                VS
              </div>
              <div className="text-center mt-1">
                <div className="text-sm sm:text-base font-mono font-black text-slate-200">
                  {featuredMatch.time === "--:--" ? "Saat TBD" : featuredMatch.time}
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  {formatDateStr(featuredMatch.date)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deplasman Takımı */}
        <div className={`flex flex-col items-center md:items-end text-center md:text-right flex-1 transition-all ${
          awayWon ? "scale-105" : ""
        }`}>
          <div className="flex flex-col items-center md:items-end gap-2">
            <TeamVolleyboxLink
              teamName={featuredMatch.away_team}
              category={featuredMatch.category || featuredMatch.age_group}
              city={featuredMatch.city || city}
              logoClassName="!w-16 !h-16 sm:!w-20 sm:!h-20 object-contain drop-shadow-2xl bg-transparent transition-transform hover:scale-110"
              className={`text-base sm:text-xl md:text-2xl transition-colors ${
                awayWon
                  ? "font-black text-white drop-shadow-glow"
                  : isFinished
                  ? "font-semibold text-slate-400"
                  : "font-black text-slate-100 hover:text-white"
              }`}
            />
            {awayWon && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                <Trophy size={11} /> KAZANDI
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alt Bilgi & Hızlı İşlemler Çubuğu */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Salon Linki & Yol Tarifi */}
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin size={14} className="text-red-400 shrink-0" />
          {featuredMatch.hall && featuredMatch.hall !== "TBD" ? (
            <a
              href={getHallNavigationUrl(featuredMatch.hall, featuredMatch.city || city)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-white underline decoration-slate-600 hover:decoration-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{featuredMatch.hall}</span>
              <Navigation size={11} className="text-slate-400" />
            </a>
          ) : (
            <span className="text-slate-500">Salon henüz belirlenmedi</span>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2">
          {onSelectMatch && (
            <button
              onClick={() => onSelectMatch(featuredMatch)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-red transition-all cursor-pointer text-xs active:scale-95"
              title="Maç Merkezi & Set Detayları"
            >
              <span>Maç Merkezi</span>
            </button>
          )}

          {!isFinished && featuredMatch.date !== "TBD" && (
            <button
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all cursor-pointer text-xs"
              title="Takvime Ekle"
            >
              <CalendarPlus size={13} className="text-primary" />
              <span className="hidden sm:inline">Takvime Ekle</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all cursor-pointer text-xs"
            title="Detayları Kopyala"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? "Kopyalandı" : "Paylaş"}</span>
          </button>

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(featuredMatch.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFav
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-400 hover:text-white"
              }`}
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Star size={14} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
