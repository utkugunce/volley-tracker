"use client";

import React from "react";
import { Star, MapPin } from "lucide-react";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { formatDateTurkish, getYesterdayString, isMatchPassed } from "@/utils/calendar";
import { isMatchScored } from "@/utils/matchScoring";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { getVolleyboxMapping } from "@/utils/volleybox";

export interface VolleyMatchRowProps {
  match: Match;
  isSelected?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelectMatch?: (m: Match) => void;
  todayStr?: string;
  leagueFallback?: string;
  cityName?: string;
  city?: string;
  leagueLabel?: string;
  showHall?: boolean;
  showDate?: boolean;
  showGroupBadge?: boolean;
}

export const VolleyMatchRow: React.FC<VolleyMatchRowProps> = ({
  match,
  isSelected = false,
  isFavorite = false,
  onToggleFavorite = () => {},
  onSelectMatch = () => {},
  todayStr,
  leagueFallback,
  cityName,
  city,
  leagueLabel,
  showHall,
  showDate,
  showGroupBadge,
}) => {
  const effectiveCity = cityName || city || match.city;
  const effectiveLeague = leagueLabel || leagueFallback || match.category;
  const yesterday = todayStr ? getYesterdayString(todayStr) : "";
  const hasScore = isMatchScored(match);
  const forfeit = getMatchForfeitInfo(match);

  const dateLabel =
    match.date === todayStr
      ? "Bugün"
      : match.date === yesterday
      ? "Dün"
      : match.date && match.date !== "TBD"
      ? formatDateTurkish(match.date)
      : "Program";

  const mappingCategory = effectiveLeague;
  const homeMapping = getVolleyboxMapping(match.home_team, mappingCategory, undefined, effectiveCity);
  const awayMapping = getVolleyboxMapping(match.away_team, mappingCategory, undefined, effectiveCity);
  const homeLogo = homeMapping?.local_logo || homeMapping?.logo_url;
  const awayLogo = awayMapping?.local_logo || awayMapping?.logo_url;

  const homeScore = match.home_score ?? match.score?.split("-")[0]?.trim();
  const awayScore = match.away_score ?? match.score?.split("-")[1]?.trim();
  const homeNum = Number(homeScore);
  const awayNum = Number(awayScore);
  const homeWon = hasScore && !Number.isNaN(homeNum) && !Number.isNaN(awayNum) && homeNum > awayNum;
  const awayWon = hasScore && !Number.isNaN(homeNum) && !Number.isNaN(awayNum) && awayNum > homeNum;

  const parsedSets = (match.set_scores || []).map((setStr) => {
    const clean = setStr.replace(/[()]/g, "").trim();
    const parts = clean.replace(":", "-").split("-").map((s) => Number.parseInt(s.trim(), 10));
    return {
      home: Number.isNaN(parts[0]) ? null : parts[0],
      away: Number.isNaN(parts[1]) ? null : parts[1],
    };
  });

  const isWaitingScore =
    !hasScore &&
    (match.date === yesterday || (match.date ? isMatchPassed(match.date, match.time, match.status) : false));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMatch(match)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectMatch(match);
        }
      }}
      className={`group relative flex items-center bg-surface hover:bg-surface-raised/70 border rounded-xl px-3 py-2.5 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer active:scale-[0.98] ${
        isSelected
          ? "border-primary/60 bg-primary/5"
          : "border-line/60 hover:border-primary/35"
      }`}
    >
      {/* 1. Sol Sütun: Saat, Tarih ve Durum (Sıfır Kutu/Çerçeve) */}
      <div className="w-[66px] sm:w-[74px] shrink-0 flex flex-col justify-center pr-2.5 border-r border-line/40 leading-tight">
        <span className="font-mono font-scoreboard tabular-nums text-xs font-semibold text-ink">
          {match.time || "--:--"}
        </span>
        <span className="text-[10px] font-medium text-ink-3 mt-0.5 truncate">
          {dateLabel}
        </span>
        {hasScore ? (
          <span className="text-[10px] font-semibold text-done mt-0.5">
            {forfeit.isForfeit ? "Hükmen" : "Bitti"}
          </span>
        ) : isWaitingScore ? (
          <span className="text-[9px] font-semibold text-warn mt-0.5">
            Skor Bekl.
          </span>
        ) : null}
      </div>

      {/* 2. Orta Sütun: Bağlam Başlığı + Alt Alta 2 Takım */}
      <div className="flex-1 min-w-0 px-3 flex flex-col justify-center gap-1">
        {/* Bağlam Satırı (ŞEHİR ROZETİ · LİG BAŞLIĞI · GRUP · SALON) */}
        <div className="flex items-center gap-1.5 text-[10px] text-ink-3 truncate leading-none pb-1">
          {/* Şehir Rozeti - Belirgin ve Vurgulu */}
          <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase tracking-wider shrink-0">
            {effectiveCity || "Genel"}
          </span>
          {/* Lig Adı - Parlak Beyaz, Kalın ve Vurgulu */}
          <span className="font-bold text-white text-[11px] truncate tracking-tight">
            {effectiveLeague || "Voleybol Ligi"}
          </span>
          {/* Grup Bilgisi - Vurgulu Amber Rozet */}
          {match.group && (
            <span className="px-1.5 py-0.5 rounded font-semibold text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
              {match.group}
            </span>
          )}
          {/* Salon Bilgisi */}
          {match.hall && match.hall !== "TBD" && (
            <>
              <span className="hidden md:inline text-ink-3/60">·</span>
              <span className="hidden md:inline-flex items-center gap-1 truncate text-ink-3/90 text-[10px]">
                <MapPin size={10} className="shrink-0 text-ink-3" />
                <span className="truncate">{match.hall}</span>
              </span>
            </>
          )}
        </div>

        {/* Ev Sahibi */}
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge name={match.home_team} logoUrl={homeLogo} size="xs" />
          <span
            className={`text-xs sm:text-[13px] truncate transition-colors ${
              homeWon
                ? "font-semibold text-white"
                : hasScore
                ? "font-medium text-ink-2"
                : "font-medium text-ink group-hover:text-white"
            }`}
          >
            {match.home_team}
          </span>
        </div>

        {/* Deplasman */}
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge name={match.away_team} logoUrl={awayLogo} size="xs" />
          <span
            className={`text-xs sm:text-[13px] truncate transition-colors ${
              awayWon
                ? "font-semibold text-white"
                : hasScore
                ? "font-medium text-ink-2"
                : "font-medium text-ink group-hover:text-white"
            }`}
          >
            {match.away_team}
          </span>
        </div>
      </div>

      {/* 3. Sağ Sütun: Set Sütunları (S1-S5) + Toplam Set Skoru + Favori */}
      <div className="shrink-0 flex items-center gap-2">
        {/* Hizalı Set Sütunları */}
        {parsedSets.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 pt-3.5 pr-1 font-mono font-scoreboard tabular-nums text-[11px]">
            {parsedSets.map((set, idx) => {
              const hWin = set.home !== null && set.away !== null && set.home > set.away;
              const aWin = set.home !== null && set.away !== null && set.away > set.home;
              return (
                <div key={idx} className="flex flex-col items-center justify-center leading-tight gap-1 min-w-[16px]">
                  <span className={hWin ? "text-emerald-400 font-bold" : "text-ink-3 font-normal"}>
                    {set.home ?? "-"}
                  </span>
                  <span className={aWin ? "text-emerald-400 font-bold" : "text-ink-3 font-normal"}>
                    {set.away ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Ana Set Skoru (3 / 1) */}
        <div className="w-[26px] pt-3.5 shrink-0 flex flex-col items-center justify-center font-mono font-scoreboard tabular-nums leading-tight gap-1 pl-2 border-l border-line/40">
          <span
            className={`text-xs sm:text-sm ${
              homeWon
                ? "font-extrabold text-emerald-400"
                : hasScore
                ? "font-medium text-ink-2"
                : "font-medium text-ink-3"
            }`}
          >
            {hasScore && homeScore !== undefined ? homeScore : "-"}
          </span>
          <span
            className={`text-xs sm:text-sm ${
              awayWon
                ? "font-extrabold text-emerald-400"
                : hasScore
                ? "font-medium text-ink-2"
                : "font-medium text-ink-3"
            }`}
          >
            {hasScore && awayScore !== undefined ? awayScore : "-"}
          </span>
        </div>

        {/* Favori Yıldızı */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(match.id);
          }}
          className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors ${
            isFavorite ? "text-warn" : "text-ink-3 hover:text-warn"
          }`}
          title={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
          aria-label={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
        >
          <Star size={14} className={isFavorite ? "fill-warn" : ""} />
        </button>
      </div>
    </div>
  );
};
