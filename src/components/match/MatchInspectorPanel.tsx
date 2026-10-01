"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Match, StandingItem } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { SetScoreMatrix } from "./SetScoreMatrix";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Star,
  ExternalLink,
  BarChart3,
  Flame,
  Navigation,
  X,
  Swords,
  UserCheck,
  CalendarPlus,
  Copy,
  Check,
  Link2,
  Layers,
  ChevronRight,
} from "lucide-react";
import { getHallNavigationUrl } from "@/utils/halls";
import { generateMatchIcs, downloadIcsFile } from "@/utils/ics";
import { slugify } from "@/utils/slugify";
import { triggerHaptic } from "@/utils/haptics";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { formatLeagueCategoryTitle, formatGroupName } from "@/utils/grouping";
import { trLower } from "@/utils/turkishLocale";

export interface MatchInspectorPanelProps {
  match: Match | null;
  allMatches?: Match[];
  standings?: Record<string, StandingItem[]>;
  onClose?: () => void;
  onToggleFavorite?: (matchId: string) => void;
  isFavorite?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const MatchInspectorPanel: React.FC<MatchInspectorPanelProps> = (props) => {
  const { match, className = "", isLoading = false } = props;

  if (!match) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-6 text-center select-none bg-[#121212] ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-[#1E222D] border border-[#2A2E3D] flex items-center justify-center text-[#94A3B8] mb-3 shadow-inner">
          <BarChart3 size={28} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Detayları görüntülemek için bir maç seçin
        </h3>
        <p className="text-xs text-[#94A3B8] max-w-[240px] mb-4 leading-relaxed">
          Skorboard, set sayıları dökümü, salon konumu, H2H form analizi ve mini puan durumunu anlık olarak inceleyin.
        </p>
        <div className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-800/50 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Sofascore Maç Merkezi
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Maç detayları yükleniyor"
        className={`flex h-full flex-col gap-3 overflow-hidden bg-[#121212] p-3 ${className}`}
      >
        <div className="h-6 w-48 shrink-0 animate-pulse rounded bg-slate-800" />
        <div className="h-28 w-full shrink-0 animate-pulse rounded-lg bg-slate-800/60" />
        <div className="space-y-2">
          <div className="h-8 w-full animate-pulse rounded bg-slate-800/60" />
          <div className="h-8 w-full animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-28 w-full animate-pulse rounded-lg bg-slate-800/40" />
      </div>
    );
  }

  return <MatchInspectorPanelContent key={match.id} {...props} match={match} />;
};

const MatchInspectorPanelContent: React.FC<Omit<MatchInspectorPanelProps, "match"> & { match: Match }> = ({
  match,
  allMatches = [],
  standings = {},
  onClose,
  onToggleFavorite,
  isFavorite = false,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "h2h" | "standings">("overview");
  const [copyFeedback, setCopyFeedback] = useState<{
    action: "text" | "link";
    status: "success" | "error";
  } | null>(null);
  const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeout.current) clearTimeout(copyFeedbackTimeout.current);
    };
  }, []);

  // 1. Boş Durum (Empty State)
  // Maç Bilgileri Hesaplamaları
  const isLive = match.status === "live";
  const isFinished =
    match.status === "finished" ||
    (match.home_score !== null &&
      match.home_score !== undefined &&
      match.away_score !== null &&
      match.away_score !== undefined);
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const effectiveCity = match.city || "İstanbul";

  const homeWon = isFinished && homeScore > awayScore;
  const awayWon = isFinished && awayScore > homeScore;

  // Maç Durumu Başlık Metni
  const getStatusLabel = () => {
    if (isLive) {
      const setsPlayed = match.set_scores ? match.set_scores.length : 0;
      return `Set ${setsPlayed + 1} Oynanıyor`;
    }
    if (isFinished) return "Maç Tamamlandı";
    if (match.status === "postponed") return "Ertelendi";
    return match.time || "Program";
  };

  const statusLabel = getStatusLabel();

  // Volleybox Mappings
  const homeMapping = getVolleyboxMapping(match.home_team, match.category, undefined, effectiveCity);
  const awayMapping = getVolleyboxMapping(match.away_team, match.category, undefined, effectiveCity);
  const homeLogo = homeMapping?.local_logo || homeMapping?.logo_url;
  const awayLogo = awayMapping?.local_logo || awayMapping?.logo_url;
  const homeSlug = slugify(homeMapping?.matched_as || match.home_team);
  const awaySlug = slugify(awayMapping?.matched_as || match.away_team);

  // Sekme 2: H2H & Form Hesaplamaları
  const homeFormMatches = useMemo(() => {
    return allMatches
      .filter(
        (m) =>
          (m.home_team === match.home_team || m.away_team === match.home_team) &&
          (m.status === "finished" || (m.home_score !== null && m.away_score !== null)) &&
          m.id !== match.id
      )
      .slice(0, 5)
      .map((m) => {
        const isHome = m.home_team === match.home_team;
        const hScore = m.home_score ?? 0;
        const aScore = m.away_score ?? 0;
        const won = isHome ? hScore > aScore : aScore > hScore;
        const opponent = isHome ? m.away_team : m.home_team;
        const resultScore = isHome ? `${hScore}-${aScore}` : `${aScore}-${hScore}`;
        return { won, opponent, resultScore, date: m.date };
      });
  }, [allMatches, match.home_team, match.id]);

  const awayFormMatches = useMemo(() => {
    return allMatches
      .filter(
        (m) =>
          (m.home_team === match.away_team || m.away_team === match.away_team) &&
          (m.status === "finished" || (m.home_score !== null && m.away_score !== null)) &&
          m.id !== match.id
      )
      .slice(0, 5)
      .map((m) => {
        const isHome = m.home_team === match.away_team;
        const hScore = m.home_score ?? 0;
        const aScore = m.away_score ?? 0;
        const won = isHome ? hScore > aScore : aScore > hScore;
        const opponent = isHome ? m.away_team : m.home_team;
        const resultScore = isHome ? `${hScore}-${aScore}` : `${aScore}-${hScore}`;
        return { won, opponent, resultScore, date: m.date };
      });
  }, [allMatches, match.away_team, match.id]);

  // Geçmiş Karşılaşmalar (H2H)
  const previousH2H = useMemo(() => {
    return allMatches
      .filter(
        (m) =>
          ((m.home_team === match.home_team && m.away_team === match.away_team) ||
            (m.home_team === match.away_team && m.away_team === match.home_team)) &&
          m.id !== match.id &&
          (m.status === "finished" || (m.home_score !== null && m.away_score !== null))
      )
      .slice(0, 5);
  }, [allMatches, match.home_team, match.away_team, match.id]);

  // Sekme 3: Mini Puan Durumu Bulma
  const groupStandingData = useMemo(() => {
    if (!standings || Object.keys(standings).length === 0) return null;

    const hTeamNorm = trLower(match.home_team.trim());
    const aTeamNorm = trLower(match.away_team.trim());

    let bestGroupKey: string | null = null;
    let bestScore = 0;

    for (const [groupKey, items] of Object.entries(standings)) {
      if (!Array.isArray(items)) continue;

      let matchCount = 0;
      for (const item of items) {
        const tNorm = trLower(item.team.trim());
        if (tNorm.includes(hTeamNorm) || hTeamNorm.includes(tNorm)) matchCount++;
        if (tNorm.includes(aTeamNorm) || aTeamNorm.includes(tNorm)) matchCount++;
      }

      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestGroupKey = groupKey;
      }
    }

    if (bestGroupKey && bestScore > 0) {
      return {
        groupName: bestGroupKey,
        items: standings[bestGroupKey] || [],
      };
    }

    return null;
  }, [standings, match.home_team, match.away_team]);

  const copyToClipboard = async (value: string, action: "text" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ action, status: "success" });
    } catch {
      setCopyFeedback({ action, status: "error" });
    }
    if (copyFeedbackTimeout.current) clearTimeout(copyFeedbackTimeout.current);
    copyFeedbackTimeout.current = setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Hızlı Aksiyon: Metin Kopyala
  const handleCopy = () => {
    triggerHaptic("light");
    const scoreStr = isFinished
      ? `Skor: ${match.home_score}-${match.away_score} (${(match.set_scores || []).join(", ")})`
      : `Tarih/Saat: ${match.date} ${match.time}`;
    const text = `TVF ${effectiveCity} ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n${scoreStr}\nSalon: ${match.hall}\nMaç No: #${match.match_no}`;
    void copyToClipboard(text, "text");
  };

  const handleCopyLink = () => {
    triggerHaptic("light");
    const url = new URL(window.location.href);
    url.searchParams.set("match", match.id);
    void copyToClipboard(url.toString(), "link");
  };

  // Hızlı Aksiyon: Takvim (.ics)
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
    <div className={`flex flex-col h-full bg-[#121212] text-xs select-none motion-reduce:animate-none animate-[match-panel-fade_200ms_ease-out] ${className}`}>
      {/* 1. Üst Bar: Başlık, Favori & Kapat */}
      <div className="px-3.5 py-2.5 border-b border-[#2A2E3D] flex items-center justify-between bg-[#1E222D]/90 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="font-bold text-white text-[12px] truncate">
            {formatLeagueCategoryTitle(match.category, match.age_group) || "Maç Detayı"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(match.id)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-amber-400 hover:bg-[#181A20] transition-colors"
              title="Favoriye Ekle"
              aria-label="Favoriye Ekle"
            >
              <Star size={14} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#181A20] transition-colors"
              title="Kapat"
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Kaydırılabilir Gövde */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* Üst Bilgi Kartı: Lig, Tarih, Salon */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span className="font-semibold text-white truncate">
              {match.category} {match.group ? `• ${formatGroupName(match.group)}` : ""}
            </span>
            <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
              #{match.match_no}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-[#94A3B8] pt-1 border-t border-[#2A2E3D]/60">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">{match.date}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Clock size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">{match.time || "Program"}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-[#CBD5E1]">
              <MapPin size={12} className="text-rose-400 shrink-0" />
              <span className="truncate">{match.hall || "Salon Açıklanacak"}</span>
            </div>
          </div>
        </div>

        {/* 2. Skorboard Başlığı (Büyük Logolar, İsimler, Set Skoru, Durum) */}
        <div className="bg-gradient-to-b from-[#1E222D] to-[#181A20] rounded-2xl border border-[#2A2E3D] p-4 shadow-md relative overflow-hidden space-y-3">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-blue-500/10 blur-2xl pointer-events-none" />

          {/* Maç Durumu Rozeti */}
          <div className="flex items-center justify-center">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-600/60 animate-pulse">
                <Flame size={12} className="text-red-400" />
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span>{statusLabel}</span>
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{statusLabel}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-medium bg-[#2A2E3D] text-[#CBD5E1] border border-[#374151]">
                <Clock size={11} className="text-amber-400" />
                <span>{statusLabel}</span>
              </span>
            )}
          </div>

          {/* Takımlar ve Skor Alanı */}
          <div className="grid grid-cols-5 items-center gap-2 pt-1">
            {/* Ev Sahibi */}
            <div className="col-span-2 flex flex-col items-center text-center space-y-1.5">
              <TeamBadge name={match.home_team} logoUrl={homeLogo} size="md" />
              <Link
                href={`/takim/${homeSlug}`}
                className={`text-[11px] sm:text-xs font-bold transition-colors line-clamp-2 leading-tight ${
                  homeWon ? "text-white" : "text-[#CBD5E1] hover:text-blue-400"
                }`}
                title={match.home_team}
              >
                {match.home_team}
              </Link>
            </div>

            {/* Skor / VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isFinished || isLive ? (
                <div className="px-2.5 py-1 rounded-xl bg-[#12141A] border border-[#2A2E3D] shadow-inner text-center font-mono font-scoreboard tabular-nums">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {homeScore} : {awayScore}
                  </span>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#1E222D] border border-[#2A2E3D] flex items-center justify-center font-black text-amber-400 text-xs font-mono shadow-xs">
                  VS
                </div>
              )}
            </div>

            {/* Deplasman */}
            <div className="col-span-2 flex flex-col items-center text-center space-y-1.5">
              <TeamBadge name={match.away_team} logoUrl={awayLogo} size="md" />
              <Link
                href={`/takim/${awaySlug}`}
                className={`text-[11px] sm:text-xs font-bold transition-colors line-clamp-2 leading-tight ${
                  awayWon ? "text-white" : "text-[#CBD5E1] hover:text-blue-400"
                }`}
                title={match.away_team}
              >
                {match.away_team}
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Voleybol Set Matrisi Tablosu */}
        <SetScoreMatrix match={match} />

        {/* 4. Bağlamsal Sekmeler (Tabs) */}
        <div className="space-y-3">
          {/* Sekme Butonları */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[#181A20] border border-[#2A2E3D] text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Genel Bakış
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("h2h")}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                activeTab === "h2h"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              H2H & Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("standings")}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                activeTab === "standings"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Grup Durumu
            </button>
          </div>

          {/* Sekme 1: Genel Bakış */}
          {activeTab === "overview" && (
            <div className="space-y-2.5">
              {/* Salon Konumu & Yol Tarifi */}
              <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-rose-400" />
                    <span>Müsabaka Salonu</span>
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-normal">
                    {effectiveCity}
                  </span>
                </div>
                <p className="text-[11px] text-[#F1F5F9] font-medium leading-relaxed">
                  {match.hall || "Salon bilgisi sisteme girilmemiştir."}
                </p>
                {match.hall && match.hall !== "TBD" && (
                  <a
                    href={getHallNavigationUrl(match.hall, effectiveCity)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E222D] hover:bg-[#252A38] border border-[#2A2E3D] text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-all group"
                  >
                    <Navigation size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    <span>Google Haritalarda Aç</span>
                    <ExternalLink size={10} className="text-[#94A3B8]" />
                  </a>
                )}
              </div>

              {/* Maç Hakemleri */}
              <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                  <UserCheck size={13} className="text-emerald-400" />
                  <span>Maç Hakemleri</span>
                </div>
                {match.referee_1 || match.referee_2 ? (
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {match.referee_1 && (
                      <div className="bg-[#1E222D] p-2 rounded-lg border border-[#2A2E3D]/80">
                        <span className="text-[#94A3B8] block text-[9px] uppercase font-bold">
                          1. Hakem
                        </span>
                        <span className="text-white font-semibold truncate block mt-0.5">
                          {match.referee_1}
                        </span>
                      </div>
                    )}
                    {match.referee_2 && (
                      <div className="bg-[#1E222D] p-2 rounded-lg border border-[#2A2E3D]/80">
                        <span className="text-[#94A3B8] block text-[9px] uppercase font-bold">
                          2. Hakem
                        </span>
                        <span className="text-white font-semibold truncate block mt-0.5">
                          {match.referee_2}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#94A3B8] bg-[#1E222D] p-2 rounded-lg border border-[#2A2E3D]/60">
                    Hakem ataması TVF bülteninde henüz açıklanmadı.
                  </p>
                )}
              </div>

              {/* Volleybox Maç Bağlantısı */}
              {match.volleybox?.url && (
                <a
                  href={match.volleybox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#181A20] hover:bg-[#1E222D] border border-[#2A2E3D] text-[11px] text-white transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold">Volleybox Maç Raporu</span>
                  </span>
                  <ExternalLink size={12} className="text-[#94A3B8] group-hover:text-white" />
                </a>
              )}

              {/* Hızlı Aksiyonlar */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#181A20] hover:bg-[#1E222D] text-[#CBD5E1] text-[10px] font-semibold border border-[#2A2E3D] transition-colors"
                >
                  <CalendarPlus size={12} className="text-amber-400" />
                  <span>Takvime Ekle</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#181A20] hover:bg-[#1E222D] text-[10px] font-semibold border border-[#2A2E3D] transition-colors ${copyFeedback?.action === "text" && copyFeedback.status === "success" ? "text-emerald-400" : "text-[#CBD5E1]"}`}
                >
                  {copyFeedback?.action === "text" ? copyFeedback.status === "success" ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>Kopyalandı! ✓</span>
                    </>
                  ) : (
                    <span className="text-rose-400">Kopyalanamadı</span>
                  ) : (
                    <>
                      <Copy size={12} className="text-blue-400" />
                      <span>Metni Kopyala</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#181A20] hover:bg-[#1E222D] text-[10px] font-semibold border border-[#2A2E3D] transition-colors ${copyFeedback?.action === "link" && copyFeedback.status === "success" ? "text-emerald-400" : "text-[#CBD5E1]"}`}
                >
                  {copyFeedback?.action === "link" ? copyFeedback.status === "success" ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>Kopyalandı! ✓</span>
                    </>
                  ) : (
                    <span className="text-rose-400">Kopyalanamadı</span>
                  ) : (
                    <>
                      <Link2 size={12} className="text-blue-400" />
                      <span>Bağlantıyı Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Sekme 2: H2H & Form */}
          {activeTab === "h2h" && (
            <div className="space-y-2.5">
              {/* Takımların Form Grafiği (Son 5 Maç) */}
              <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-3">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <BarChart3 size={13} className="text-blue-400" />
                  <span>Son 5 Maç Formu</span>
                </div>

                {/* Ev Sahibi Formu */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#CBD5E1] font-semibold truncate max-w-[180px]">
                      {match.home_team}
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      {homeFormMatches.filter((f) => f.won).length}G -{" "}
                      {homeFormMatches.filter((f) => !f.won).length}M
                    </span>
                  </div>
                  {homeFormMatches.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {homeFormMatches.map((f, i) => (
                        <span
                          key={i}
                          title={`${f.date}: ${f.resultScore} vs ${f.opponent}`}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono transition-transform hover:scale-110 ${
                            f.won
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {f.won ? "G" : "M"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#94A3B8]">Önceki maç kaydı bulunamadı.</div>
                  )}
                </div>

                {/* Deplasman Formu */}
                <div className="space-y-1.5 pt-2 border-t border-[#2A2E3D]/50">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#CBD5E1] font-semibold truncate max-w-[180px]">
                      {match.away_team}
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      {awayFormMatches.filter((f) => f.won).length}G -{" "}
                      {awayFormMatches.filter((f) => !f.won).length}M
                    </span>
                  </div>
                  {awayFormMatches.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {awayFormMatches.map((f, i) => (
                        <span
                          key={i}
                          title={`${f.date}: ${f.resultScore} vs ${f.opponent}`}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono transition-transform hover:scale-110 ${
                            f.won
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {f.won ? "G" : "M"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#94A3B8]">Önceki maç kaydı bulunamadı.</div>
                  )}
                </div>
              </div>

              {/* Önceki Karşılaşmalar (H2H) */}
              <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Swords size={13} className="text-amber-400" />
                    <span>Önceki Karşılaşmalar</span>
                  </span>
                  <Link
                    href={`/karsilastir?takim1=${homeSlug}&takim2=${awaySlug}`}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Analiz</span>
                    <ChevronRight size={11} />
                  </Link>
                </div>

                {previousH2H.length > 0 ? (
                  <div className="space-y-1.5">
                    {previousH2H.map((prevMatch) => (
                      <div
                        key={prevMatch.id}
                        className="bg-[#1E222D] p-2 rounded-lg border border-[#2A2E3D]/80 flex items-center justify-between text-[10px]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[#94A3B8] block text-[9px]">{prevMatch.date}</span>
                          <span className="text-white font-medium truncate block">
                            {prevMatch.home_team} - {prevMatch.away_team}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-[#181A20] border border-[#2A2E3D] shrink-0">
                          {prevMatch.home_score ?? 0} : {prevMatch.away_score ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#94A3B8] bg-[#1E222D] p-2 rounded-lg border border-[#2A2E3D]/60">
                    Bu sezon iki takım arasında daha önce oynanmış müsabaka bulunmamaktadır.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sekme 3: Grup Durumu (Mini Puan Durumu) */}
          {activeTab === "standings" && (
            <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] overflow-hidden space-y-2">
              <div className="p-3 pb-0 flex items-center justify-between text-[11px] font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-400" />
                  <span className="truncate max-w-[200px]">
                    {groupStandingData ? formatGroupName(groupStandingData.groupName) : "Grup Puan Durumu"}
                  </span>
                </span>
                <span className="text-[9px] bg-blue-950/60 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded font-mono">
                  Mini Tablo
                </span>
              </div>

              {groupStandingData && groupStandingData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1E222D] text-[#94A3B8] text-[10px] border-y border-[#2A2E3D] font-bold uppercase">
                        <th className="py-1.5 px-2 text-center w-6">#</th>
                        <th className="py-1.5 px-2 text-left">Takım</th>
                        <th className="py-1.5 px-1.5 text-center font-mono w-7" title="Oynanan Maç">O</th>
                        <th className="py-1.5 px-1.5 text-center font-mono w-7" title="Galibiyet">G</th>
                        <th className="py-1.5 px-1.5 text-center font-mono w-7" title="Mağlubiyet">M</th>
                        <th className="py-1.5 px-2 text-center font-mono text-white font-bold w-9" title="Puan">P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2E3D]/40">
                      {groupStandingData.items.map((item, idx) => {
                        const isSelectedTeam =
                          trLower(item.team).includes(trLower(match.home_team)) ||
                          trLower(match.home_team).includes(trLower(item.team)) ||
                          trLower(item.team).includes(trLower(match.away_team)) ||
                          trLower(match.away_team).includes(trLower(item.team));

                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isSelectedTeam
                                ? "bg-blue-600/15 font-bold text-white"
                                : "hover:bg-[#1E222D]/40 text-[#CBD5E1]"
                            }`}
                          >
                            <td className="py-1.5 px-2 text-center font-mono text-[10px] text-[#94A3B8]">
                              {item.rank || idx + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <TeamBadge name={item.team} size="xs" />
                                <span className="truncate max-w-[130px]" title={item.team}>
                                  {item.team}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[10px] text-[#94A3B8]">
                              {item.played}
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[10px] text-emerald-400">
                              {item.won}
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-mono text-[10px] text-rose-400">
                              {item.lost}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-bold text-white text-[11px] bg-[#1E222D]/30">
                              {item.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 text-center text-[10px] text-[#94A3B8]">
                  Bu maçtaki takımlara ait grup puan durumu henüz bültende yer almamaktadır.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
