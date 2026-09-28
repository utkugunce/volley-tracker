"use client";

import React from "react";
import { CalendarPlus, Star } from "lucide-react";
import { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { downloadIcsFile, generateMatchIcs } from "@/utils/ics";

export type MatchRowMode = "today" | "results" | "fixtures";

interface CompactMatchRowProps {
  match: Match;
  isSelected?: boolean;
  onSelect?: (match: Match) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  mode?: MatchRowMode;
}

export const CompactMatchRow: React.FC<CompactMatchRowProps> = ({
  match,
  isSelected = false,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  mode = "today",
}) => {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished" || (match.home_score !== null && match.home_score !== undefined);
  const isPostponed = match.status === "postponed";
  const discrepancy = match.volleybox?.discrepancy;
  const hasDiscrepancy = Boolean(discrepancy?.has_diff);

  const homeScore = match.home_score;
  const awayScore = match.away_score;

  const homeWon = isFinished && typeof homeScore === "number" && typeof awayScore === "number" && homeScore > awayScore;
  const awayWon = isFinished && typeof homeScore === "number" && typeof awayScore === "number" && awayScore > homeScore;

  // Set skorları ayrıştırma: ["25-20", "23-25", "25-18"] -> [{ home: 25, away: 20 }, ...]
  const parsedSets = (match.set_scores || []).map((setStr) => {
    const parts = setStr.replace(":", "-").split("-").map((s) => Number.parseInt(s.trim(), 10));
    return {
      home: Number.isNaN(parts[0]) ? null : parts[0],
      away: Number.isNaN(parts[1]) ? null : parts[1],
    };
  });

  const handleAddToCalendar = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const ics = generateMatchIcs(match);
    if (ics) {
      downloadIcsFile(`mac-${match.home_team}-${match.away_team}-${match.date}.ics`, ics);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-match-row="true"
      data-match-id={match.id}
      onClick={() => onSelect?.(match)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(match);
        }
      }}
      className={`group relative flex items-center min-h-[46px] px-2.5 py-1.5 transition-all cursor-pointer border-b border-[#2A2E3D]/50 select-none ${
        isSelected
          ? "bg-slate-800/80 border-l-2 border-l-blue-500 shadow-inner"
          : hasDiscrepancy
          ? "bg-amber-950/30 border-l-2 border-l-amber-400 hover:bg-amber-950/50"
          : "hover:bg-[#1E222D]/80 bg-[#181A20]"
      }`}
    >
      {/* 1. Sol Kısım (60px): Saat ve Durum */}
      <div className="w-[74px] shrink-0 flex flex-col justify-center items-start leading-tight pr-1.5 border-r border-[#2A2E3D]/40">
        <span
          className={`font-mono text-[11px] font-semibold px-1 py-0.5 rounded ${
            discrepancy?.time_diff
              ? "bg-amber-500/15 border border-amber-400/50 text-amber-200"
              : "text-[#F1F5F9]"
          }`}
          title={discrepancy?.time_diff ? discrepancy.details || "Saat Volleybox kaydından farklı" : undefined}
        >
          {match.time || "--:--"}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-[#EF4444]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
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
          <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${
            discrepancy?.date_diff
              ? "bg-amber-500/15 border border-amber-400/50 text-amber-200"
              : "text-[#64748B]"
          }`} title={discrepancy?.date_diff ? discrepancy.details || "Tarih Volleybox kaydından farklı" : undefined}>
            {match.date ? match.date.slice(5) : "Program"}
          </span>
        )}
        {discrepancy?.date_diff && discrepancy.vb_date && (
          <span className="mt-0.5 rounded border border-amber-500/30 bg-amber-950/70 px-1 text-[8px] font-semibold text-amber-300">
            VB {discrepancy.vb_date.slice(5)}
          </span>
        )}
        {discrepancy?.time_diff && discrepancy.vb_time && (
          <span className="mt-0.5 rounded border border-amber-500/30 bg-amber-950/70 px-1 text-[8px] font-semibold text-amber-300">
            VB {discrepancy.vb_time}
          </span>
        )}
        {(isLive || isFinished || isPostponed) && discrepancy?.date_diff && discrepancy.vb_date && (
          <span className="mt-0.5 rounded border border-amber-500/40 bg-amber-500/15 px-1 text-[8px] font-semibold text-amber-200">
            {match.date?.slice(5)} / VB {discrepancy.vb_date.slice(5)}
          </span>
        )}
      </div>

      {/* 2. Orta Kısım: Takımlar ve Set Puanları */}
      <div className="flex-1 min-w-0 flex items-center justify-between px-2.5">
        {/* Takım İsimleri (Üstte Ev, Altta Dep) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 pr-2">
          {/* Ev Sahibi */}
          <div className="flex items-center gap-1.5 truncate">
            <TeamVolleyboxLink
              teamName={match.home_team}
              category={match.category || match.age_group}
              city={match.city}
              showFavoriteButton={false}
              logoClassName="!w-5 !h-5 !mr-1"
              className={`min-w-0 max-w-full text-[12px] leading-none ${
                homeWon
                  ? "font-bold text-white"
                  : isFinished
                  ? "font-medium text-[#94A3B8]"
                  : "font-medium text-[#F1F5F9]"
              }`}
            >
              {match.home_team}
            </TeamVolleyboxLink>
          </div>

          {/* Deplasman */}
          <div className="flex items-center gap-1.5 truncate">
            <TeamVolleyboxLink
              teamName={match.away_team}
              category={match.category || match.age_group}
              city={match.city}
              showFavoriteButton={false}
              logoClassName="!w-5 !h-5 !mr-1"
              className={`min-w-0 max-w-full text-[12px] leading-none ${
                awayWon
                  ? "font-bold text-white"
                  : isFinished
                  ? "font-medium text-[#94A3B8]"
                  : "font-medium text-[#F1F5F9]"
              }`}
            >
              {match.away_team}
            </TeamVolleyboxLink>
          </div>
          {mode === "fixtures" && match.hall && match.hall !== "TBD" && (
            <span className={`truncate pl-6 text-[9px] leading-tight ${discrepancy?.hall_diff ? "inline-flex rounded border border-amber-400/40 bg-amber-500/10 px-1 text-amber-200" : "text-slate-500"}`} title={discrepancy?.hall_diff ? discrepancy.details || match.hall : match.hall}>
              {match.hall}
            </span>
          )}
          {mode === "fixtures" && discrepancy?.hall_diff && discrepancy.vb_hall && (
            <span className="truncate pl-6 text-[8px] font-semibold leading-tight text-amber-300" title={`Volleybox salonu: ${discrepancy.vb_hall}`}>
              VB: {discrepancy.vb_hall}
            </span>
          )}
        </div>

        {/* Set Puanları Sütunları (Desktop/Geniş Ekran) */}
        {parsedSets.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono pr-2.5 text-[#64748B]">
            {parsedSets.map((set, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center leading-none gap-0.5">
                <span className={`rounded px-1 py-0.5 ${
                  mode === "today" && isLive && idx === parsedSets.length - 1
                    ? "bg-blue-500/10 text-blue-300 font-semibold"
                    : set.home !== null && set.away !== null && set.home > set.away
                    ? "bg-emerald-500/10 text-emerald-400 font-bold"
                    : "text-slate-500 font-normal"
                }`}>
                  {set.home ?? "-"}
                </span>
                <span className={`rounded px-1 py-0.5 ${
                  mode === "today" && isLive && idx === parsedSets.length - 1
                    ? "bg-blue-500/10 text-blue-300 font-semibold"
                    : set.home !== null && set.away !== null && set.away > set.home
                    ? "bg-emerald-500/10 text-emerald-400 font-bold"
                    : "text-slate-500 font-normal"
                }`}>
                  {set.away ?? "-"}
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
      <div className="shrink-0 flex items-center gap-0.5 pl-1.5 pr-0.5">
        {mode === "fixtures" && (
          <button
            type="button"
            aria-label="Takvime ekle"
            title="Takvime ekle"
            disabled={!match.date || match.date === "TBD"}
            onClick={handleAddToCalendar}
            className="p-1 rounded-md text-slate-500 hover:text-sky-400 disabled:opacity-30 transition-colors"
          >
            <CalendarPlus size={13} />
          </button>
        )}
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
              : "text-[#64748B] hover:text-amber-400 opacity-100 sm:opacity-70 sm:group-hover:opacity-100"
          }`}
        >
          <Star size={13} className={isFavorite ? "fill-amber-400" : ""} />
        </button>
      </div>
    </div>
  );
};
