"use client";

import React from "react";
import { Star } from "lucide-react";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";

interface CompactMatchRowProps {
  match: Match;
  isSelected?: boolean;
  onSelect?: (match: Match) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const CompactMatchRow: React.FC<CompactMatchRowProps> = ({
  match,
  isSelected = false,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished" || (match.home_score !== null && match.home_score !== undefined);
  const isPostponed = match.status === "postponed";

  const homeScore = match.home_score;
  const awayScore = match.away_score;

  const homeWon = isFinished && typeof homeScore === "number" && typeof awayScore === "number" && homeScore > awayScore;
  const awayWon = isFinished && typeof homeScore === "number" && typeof awayScore === "number" && awayScore > homeScore;

  // Set skorları ayrıştırma: ["25-20", "23-25", "25-18"] -> [{ home: 25, away: 20 }, ...]
  const parsedSets = (match.set_scores || []).map((setStr) => {
    const parts = setStr.split("-").map((s) => s.trim());
    return {
      home: parts[0] || "-",
      away: parts[1] || "-",
    };
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(match)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(match);
        }
      }}
      className={`group relative flex items-center h-[46px] px-2.5 transition-all cursor-pointer border-b border-[#2A2E3D]/50 select-none ${
        isSelected
          ? "bg-slate-800/80 border-l-2 border-l-blue-500 shadow-inner"
          : "hover:bg-[#1E222D]/80 bg-[#181A20]"
      }`}
    >
      {/* 1. Sol Kısım (60px): Saat ve Durum */}
      <div className="w-[58px] shrink-0 flex flex-col justify-center items-start leading-tight pr-1.5 border-r border-[#2A2E3D]/40">
        <span className="font-mono text-[11px] font-semibold text-[#F1F5F9]">
          {match.time || "--:--"}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-[#EF4444] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span>CANLI</span>
          </span>
        ) : isFinished ? (
          <span className="text-[9px] font-bold text-emerald-400">
            Bitti
          </span>
        ) : isPostponed ? (
          <span className="text-[9px] font-medium text-slate-400">
            Ertelendi
          </span>
        ) : (
          <span className="text-[9px] font-medium text-[#64748B]">
            {match.date ? match.date.slice(5) : "Program"}
          </span>
        )}
      </div>

      {/* 2. Orta Kısım: Takımlar ve Set Puanları */}
      <div className="flex-1 min-w-0 flex items-center justify-between px-2.5">
        {/* Takım İsimleri (Üstte Ev, Altta Dep) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 pr-2">
          {/* Ev Sahibi */}
          <div className="flex items-center gap-1.5 truncate">
            <TeamBadge name={match.home_team} size="xs" />
            <span
              className={`text-[12px] truncate leading-none ${
                homeWon
                  ? "font-bold text-white"
                  : isFinished
                  ? "font-medium text-[#94A3B8]"
                  : "font-medium text-[#F1F5F9]"
              }`}
            >
              {match.home_team}
            </span>
          </div>

          {/* Deplasman */}
          <div className="flex items-center gap-1.5 truncate">
            <TeamBadge name={match.away_team} size="xs" />
            <span
              className={`text-[12px] truncate leading-none ${
                awayWon
                  ? "font-bold text-white"
                  : isFinished
                  ? "font-medium text-[#94A3B8]"
                  : "font-medium text-[#F1F5F9]"
              }`}
            >
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Set Puanları Sütunları (Desktop/Geniş Ekran) */}
        {parsedSets.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono pr-2.5 text-[#64748B]">
            {parsedSets.map((set, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center leading-none gap-0.5">
                <span className={set.home > set.away && isFinished ? "text-slate-300 font-semibold" : "text-[#64748B]"}>
                  {set.home}
                </span>
                <span className={set.away > set.home && isFinished ? "text-slate-300 font-semibold" : "text-[#64748B]"}>
                  {set.away}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Toplam Set Skoru */}
        <div className="w-[32px] shrink-0 flex flex-col items-center justify-center font-mono leading-none gap-0.5 pl-1.5 border-l border-[#2A2E3D]/40">
          <span
            className={`text-xs ${
              homeWon
                ? "font-extrabold text-white"
                : isFinished
                ? "font-bold text-[#64748B]"
                : "font-semibold text-slate-400"
            }`}
          >
            {typeof homeScore === "number" ? homeScore : "-"}
          </span>
          <span
            className={`text-xs ${
              awayWon
                ? "font-extrabold text-white"
                : isFinished
                ? "font-bold text-[#64748B]"
                : "font-semibold text-slate-400"
            }`}
          >
            {typeof awayScore === "number" ? awayScore : "-"}
          </span>
        </div>
      </div>

      {/* 3. Sağ Kısım: Favori Yıldızı */}
      <div className="shrink-0 pl-1.5 pr-0.5">
        <button
          type="button"
          aria-label={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(match.id);
          }}
          className={`p-1 rounded-md transition-colors ${
            isFavorite
              ? "text-amber-400"
              : "text-[#64748B] hover:text-amber-400 opacity-0 group-hover:opacity-100 sm:opacity-70"
          }`}
        >
          <Star size={13} className={isFavorite ? "fill-amber-400" : ""} />
        </button>
      </div>
    </div>
  );
};
