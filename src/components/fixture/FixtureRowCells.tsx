import React from "react";
import { Star, MapPin, AlertTriangle } from "lucide-react";
import type { DiscrepancyInfo, Match } from "@/types/fixture";
import { getHallNavigationUrl } from "@/utils/halls";
import { formatRowDate } from "@/utils/fixtureTable";

export interface FixtureCellBaseProps {
  cardBorderClass: string;
}

interface FixtureFavoriteCellProps extends FixtureCellBaseProps {
  match: Match;
  isFav: boolean;
  hasDiff: boolean;
  onToggleFavorite?: (id: string) => void;
}

/** ⭐ Favori */
export function FixtureFavoriteCell({ match, isFav, hasDiff, cardBorderClass, onToggleFavorite }: FixtureFavoriteCellProps) {
  return (
    <td className={`py-2.5 px-2 text-center w-8 rounded-l-xl border-l border-y ${cardBorderClass} ${hasDiff ? "border-l-4 border-l-amber-500" : isFav ? "border-l-3 border-l-amber-400" : ""}`}>
      <button
        onClick={() => onToggleFavorite?.(match.id)}
        className="p-1 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-all active:scale-90"
        title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        aria-label={isFav ? `${match.home_team} - ${match.away_team} maçını favorilerden çıkar` : `${match.home_team} - ${match.away_team} maçını favorilere ekle`}
      >
        <Star
          size={13}
          className={isFav ? "fill-amber-400 text-amber-400 drop-shadow-xs" : ""}
        />
      </button>
    </td>
  );
}

interface FixtureDateCellProps extends FixtureCellBaseProps {
  disc: DiscrepancyInfo | null | undefined;
  formattedDate: string;
}

/** 1. Tarih */
export function FixtureDateCell({ disc, formattedDate, cardBorderClass }: FixtureDateCellProps) {
  return (
    <td className={`py-2.5 px-2 whitespace-nowrap w-[85px] border-y ${cardBorderClass}`}>
      <div className="inline-flex flex-col">
        <span className={`inline-flex items-center font-mono font-bold text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs ${
          disc?.date_diff
            ? "bg-amber-900/70 text-amber-200 border border-amber-600/80 font-black"
            : "bg-slate-800/80 text-slate-200 border border-slate-700/60"
        }`}>
          {formattedDate}
        </span>
        {disc?.date_diff && disc.vb_date && (
          <div
            className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 mt-1 shadow-xs"
            title={`İl bülteninde tarih değişti! Volleybox'taki eski tarih: ${disc.vb_date}`}
          >
            <AlertTriangle size={8} className="text-amber-400 shrink-0" />
            <span>VB: {formatRowDate(disc.vb_date)}</span>
          </div>
        )}
      </div>
    </td>
  );
}

interface FixtureTimeCellProps extends FixtureCellBaseProps {
  match: Match;
  disc: DiscrepancyInfo | null | undefined;
}

/** 2. Saat */
export function FixtureTimeCell({ match, disc, cardBorderClass }: FixtureTimeCellProps) {
  return (
    <td className={`py-2.5 px-2 text-center whitespace-nowrap w-14 border-y ${cardBorderClass}`}>
      <div className="inline-flex flex-col items-center justify-center">
        {match.time === "--:--" ? (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[10px] text-slate-500 bg-slate-800/50 border border-slate-700/40">-</span>
        ) : (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-black text-[11px] shadow-xs tracking-wide ${
            disc?.time_diff
              ? "bg-amber-900/70 text-amber-200 border border-amber-600/80"
              : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
          }`}>
            {match.time}
          </span>
        )}
        {disc?.time_diff && disc.vb_time && (
          <div
            className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center justify-center gap-0.5 mt-1 shadow-xs"
            title={`İl bülteninde saat değişti! Volleybox'taki eski saat: ${disc.vb_time}`}
          >
            <AlertTriangle size={8} className="text-amber-400 shrink-0" />
            <span>VB: {disc.vb_time}</span>
          </div>
        )}
      </div>
    </td>
  );
}

interface FixtureHallCellProps extends FixtureCellBaseProps {
  match: Match;
  disc: DiscrepancyInfo | null | undefined;
  effectiveCity: string | undefined;
}

/** 3. Yer */
export function FixtureHallCell({ match, disc, effectiveCity, cardBorderClass }: FixtureHallCellProps) {
  return (
    <td className={`py-2.5 px-2 whitespace-nowrap border-y ${cardBorderClass}`} title={match.hall}>
      {match.hall && match.hall !== "TBD" ? (
        <a
          href={getHallNavigationUrl(match.hall, match.city || effectiveCity)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all max-w-[95px] lg:max-w-[150px] truncate group/hall shadow-2xs"
          title={`${match.hall} — Haritada Gör & Yol Tarifi Al`}
        >
          <MapPin size={11} className={disc?.hall_diff ? "text-amber-400 shrink-0" : "text-ink-2 group-hover/hall:scale-110 shrink-0 transition-transform"} />
          <span className={`truncate text-[11px] font-medium ${disc?.hall_diff ? "text-amber-200 font-bold" : ""}`}>
            {match.hall}
          </span>
        </a>
      ) : (
        <span className="text-slate-500 text-[11px] font-mono px-2">-</span>
      )}
      {disc?.hall_diff && disc.vb_hall && (
        <div
          className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 mt-1 truncate max-w-[110px] shadow-xs"
          title={`İl bülteninde salon değişti! Volleybox'taki salon: ${disc.vb_hall}`}
        >
          <AlertTriangle size={8} className="text-amber-400 shrink-0" />
          <span className="truncate">VB: {disc.vb_hall}</span>
        </div>
      )}
    </td>
  );
}
