"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Match } from "@/types/fixture";
import { TeamBadge } from "./TeamBadge";
import { SocialStoryModal } from "./SocialStoryModal";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  CalendarPlus,
  Copy,
  Check,
  Share2,
  Swords,
  Navigation,
  Trophy,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { getHallNavigationUrl } from "@/utils/halls";
import { generateMatchIcs, downloadIcsFile } from "@/utils/ics";
import { slugify } from "@/utils/slugify";
import { triggerHaptic } from "@/utils/haptics";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface MatchCenterDrawerProps {
  match: Match | null;
  onClose: () => void;
  city?: string;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export const MatchCenterDrawer: React.FC<MatchCenterDrawerProps> = ({
  match,
  onClose,
  city = "İstanbul",
  onToggleFavorite,
  isFavorite = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // ESC tuşuyla kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!match) return null;

  const effectiveCity = match.city || city;
  const isFinished = match.status === "finished";
  const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);

  const homeMapping = getVolleyboxMapping(match.home_team, match.category, undefined, effectiveCity);
  const awayMapping = getVolleyboxMapping(match.away_team, match.category, undefined, effectiveCity);

  const homeLogo = homeMapping?.local_logo || homeMapping?.logo_url;
  const awayLogo = awayMapping?.local_logo || awayMapping?.logo_url;

  const homeSlug = slugify(homeMapping?.matched_as || match.home_team);
  const awaySlug = slugify(awayMapping?.matched_as || match.away_team);

  const handleCopy = () => {
    triggerHaptic("light");
    const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
    const scoreText = isFinished
      ? `\nSkor: ${match.score} (${(match.set_scores || []).join(", ")})`
      : "";
    const text = `TVF ${effectiveCity} ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n🗓 ${dateText}\n📍 ${match.hall}${scoreText}\nMaç No: #${match.match_no}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    triggerHaptic("medium");
    if (!match.date || match.date === "TBD") {
      alert("Bu maçın tarihi henüz açıklanmadığı için takvime eklenemez.");
      return;
    }
    const ics = generateMatchIcs(match);
    if (ics) {
      downloadIcsFile(`mac-${match.home_team}-${match.away_team}-${match.date}.ics`, ics);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        {/* Çekmece Gövdesi (Masaüstünde sağdan kayar, mobilde alttan) */}
        <div
          className="relative w-full sm:max-w-lg md:max-w-xl h-full bg-[#080c14] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Üst Bar: Kategori & Kapat */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                TVF {effectiveCity}
              </span>
              <h3 className="text-xs font-bold text-slate-300 truncate">
                {match.category} • {match.group}
              </h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Kapat (ESC)"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          {/* 2. Kaydırılabilir İçerik */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Büyük Skorboard */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0d1424]/90 to-slate-950 border border-slate-800/90 p-5 shadow-card relative overflow-hidden">
              {/* Arka Plan Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-red-600/10 blur-3xl pointer-events-none" />

              {/* Maç Durumu Rozeti */}
              <div className="flex items-center justify-center mb-4">
                {isFinished ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Maç Tamamlandı
                  </span>
                ) : match.status === "live" ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-500 shadow-glow-red animate-pulse">
                    <Flame size={12} className="text-red-400" />
                    CANLI MAÇ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <Clock size={12} className="text-amber-400" />
                    {match.date} • {match.time}
                  </span>
                )}
              </div>

              {/* Takımlar ve Skor */}
              <div className="grid grid-cols-5 items-center gap-2">
                {/* Ev Sahibi Takım */}
                <div className="col-span-2 flex flex-col items-center text-center space-y-2">
                  <TeamBadge name={match.home_team} logoUrl={homeLogo} size="lg" />
                  <Link
                    href={`/takim/${homeSlug}`}
                    className="text-xs sm:text-sm font-bold text-slate-100 hover:text-primary transition-colors line-clamp-2 leading-tight"
                    title={`${match.home_team} Profili`}
                  >
                    {match.home_team}
                  </Link>
                </div>

                {/* Skor / VS */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  {isFinished ? (
                    <div className="px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-lg text-center font-scoreboard">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {match.home_score ?? 0} : {match.away_score ?? 0}
                      </span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shadow-xs font-scoreboard">
                      VS
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    #{match.match_no}
                  </span>
                </div>

                {/* Deplasman Takımı */}
                <div className="col-span-2 flex flex-col items-center text-center space-y-2">
                  <TeamBadge name={match.away_team} logoUrl={awayLogo} size="lg" />
                  <Link
                    href={`/takim/${awaySlug}`}
                    className="text-xs sm:text-sm font-bold text-slate-100 hover:text-primary transition-colors line-clamp-2 leading-tight"
                    title={`${match.away_team} Profili`}
                  >
                    {match.away_team}
                  </Link>
                </div>
              </div>

              {/* Set Skorları Tablosu */}
              {isFinished && match.set_scores && match.set_scores.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Set Skorları Dökümü
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {match.set_scores.map((setStr, idx) => {
                      const parts = setStr.split("-").map((n) => parseInt(n.trim(), 10));
                      const isHomeSet =
                        parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > parts[1];
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs flex flex-col items-center min-w-[64px] ${
                            isHomeSet
                              ? "bg-red-950/60 text-red-200 border-red-800/80"
                              : "bg-slate-900 text-slate-200 border-slate-700"
                          }`}
                        >
                          <span className="text-[9px] text-slate-400 uppercase font-sans">
                            {idx + 1}. Set
                          </span>
                          <span className="text-sm">{setStr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Salon & Yol Tarifi */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <MapPin size={14} className="text-red-400" />
                <span>Salon ve Konum Bilgisi</span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {match.hall || "Salon Açıklanacak"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {effectiveCity} • TVF Resmi Müsabaka Salonu
                  </div>
                </div>
                {match.hall && match.hall !== "TBD" && (
                  <a
                    href={getHallNavigationUrl(match.hall, effectiveCity)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-glow-red shrink-0 cursor-pointer active:scale-95"
                  >
                    <Navigation size={13} />
                    <span>Yol Tarifi</span>
                  </a>
                )}
              </div>
            </div>

            {/* İki Takımı Karşılaştır (H2H) */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Swords size={14} className="text-amber-400" />
                  <span>Kafaya Kafaya (H2H) Analiz</span>
                </div>
                <Link
                  href={`/karsilastir?takim1=${homeSlug}&takim2=${awaySlug}`}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Detaylı Karşılaştır</span>
                  <ExternalLink size={11} />
                </Link>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                Bu iki takımın bu sezonki galibiyet oranlarını, set averajlarını ve geçmiş maçlarını
                incelemek için karşılaştırma sayfasını kullanabilirsiniz.
              </div>
            </div>

            {/* Volleybox Senkronizasyon Durumu */}
            {match.volleybox && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Volleybox Maç Kaydı</span>
                  {match.volleybox.url && (
                    <a
                      href={match.volleybox.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      <span>Volleybox'ta Aç</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                {match.volleybox.discrepancy?.has_diff && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span>
                      Dikkat: İl bülteninde değişiklik yapıldı ({match.volleybox.discrepancy.details || "Saat/Salon farklı"}).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Alt Aksiyon Çubuğu (Quick Actions) */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-2 shrink-0">
            <button
              onClick={() => setShowStoryModal(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-glow-red hover:from-red-500 hover:to-rose-500 transition-all active:scale-95 cursor-pointer"
              title="Instagram/WhatsApp Story için görsel oluştur"
            >
              <Share2 size={14} />
              <span>Hikaye Kartı</span>
            </button>

            <button
              onClick={handleDownloadIcs}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
              title="Takvime Ekle (.ics)"
            >
              <CalendarPlus size={14} className="text-amber-400" />
              <span>Takvim (.ics)</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
              title="Metni Kopyala"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-300">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hikaye Modal'ı */}
      {showStoryModal && (
        <SocialStoryModal
          match={match}
          onClose={() => setShowStoryModal(false)}
          city={effectiveCity}
        />
      )}
    </>
  );
};
