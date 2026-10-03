"use client";

import React from "react";
import { Star, MapPin, CalendarPlus, Copy, Check, AlertTriangle, ChevronRight } from "lucide-react";
import type { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { isMatchOverdueForScore } from "@/utils/calendar";
import { getHallNavigationUrl } from "@/utils/halls";
import { getFixtureRowState, isHomeSetWin } from "@/utils/fixtureTable";

interface FixtureGridCardProps {
  match: Match;
  idx: number;
  matches: Match[];
  hasMultipleGroups: boolean;
  favorites: string[];
  copiedId: string | null;
  effectiveCity: string | undefined;
  onToggleFavorite?: (id: string) => void;
  onSelectMatch?: (match: Match) => void;
  handleCopy: (e: React.MouseEvent, match: Match) => void;
  handleDownloadIcs: (e: React.MouseEvent, match: Match) => void;
}

/** Yayın tarzı grid görünümünde tek bir maç kartı (grup değiştiyse önce grup başlığı). */
export function FixtureGridCard({
  match,
  idx,
  matches,
  hasMultipleGroups,
  favorites,
  copiedId,
  effectiveCity,
  onToggleFavorite,
  onSelectMatch,
  handleCopy,
  handleDownloadIcs,
}: FixtureGridCardProps) {
  const {
    isFav,
    isFinished,
    homeWon,
    awayWon,
    formattedDate,
    isCopied,
    hasDiff,
    forfeitInfo,
    currentGroup,
    isFirstOfGroup,
    matchesInGroupCount,
  } = getFixtureRowState(match, idx, matches, hasMultipleGroups, favorites, copiedId);

  return (
      <React.Fragment>
        {isFirstOfGroup && (
          <div className="col-span-full flex items-center justify-between py-2 px-3.5 bg-surface-muted/95 rounded-xl border border-amber-500/25 text-amber-300 text-xs font-bold uppercase mt-2 mb-0.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-glow-amber"></span>
              <span className="font-black text-amber-300 tracking-wide">{currentGroup}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {matchesInGroupCount} Maç
            </span>
          </div>
        )}
        <div
        className={`rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
          hasDiff
            ? "bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-600/50 shadow-md shadow-amber-950/20"
            : isFav
            ? "bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 border-amber-400/50 shadow-md shadow-amber-500/10"
            : "bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border-slate-800/80 hover:border-slate-700/80 shadow-card hover:shadow-lg"
        }`}
      >
        {/* Kart Üst Bilgi Çubuğu */}
        <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/70 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-slate-200">
              {formattedDate}
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono font-semibold text-slate-300">
              {match.time === "--:--" ? "Saat Belirtilmedi" : match.time}
            </span>
            {isFinished && (
              <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                forfeitInfo.isForfeit
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-done/15 text-done border border-done/30"
              }`}>
                {forfeitInfo.isForfeit ? "Hükmen" : "Bitti"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isFinished && match.date !== "TBD" && (
              <button
                onClick={(e) => handleDownloadIcs(e, match)}
                className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                title="Takvime Ekle (.ics)"
              >
                <CalendarPlus size={13} />
              </button>
            )}
            <button
              onClick={(e) => handleCopy(e, match)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Maç Detayını Kopyala"
            >
              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <button
              onClick={() => onToggleFavorite?.(match.id)}
              className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
              aria-label={isFav ? `${match.home_team} - ${match.away_team} maçını favorilerden çıkar` : `${match.home_team} - ${match.away_team} maçını favorilere ekle`}
            >
              <Star size={13} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* Kart Gövdesi: Takımlar & Skorlar */}
        <div className="p-3.5 space-y-2.5">
          {/* Ev Sahibi Takım */}
          <div
            className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-colors ${
              homeWon ? "bg-primary/10 border border-primary/25 shadow-xs" : "bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={match.home_team}
                category={match.category || match.age_group}
                city={match.city || effectiveCity}
                logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 object-contain drop-shadow-md bg-transparent shrink-0"
                className={`text-xs sm:text-sm truncate transition-colors ${
                  homeWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-medium text-slate-400"
                    : "font-bold text-slate-200 hover:text-white"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono font-scoreboard tabular-nums text-sm font-black">
              {isFinished ? (
                <span
                  className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-black ${
                    homeWon
                      ? "bg-done/15 text-done border border-done/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {match.home_score ?? 0}
                </span>
              ) : (
                <span className="text-slate-600 text-xs">-</span>
              )}
            </div>
          </div>

          {/* Deplasman Takımı */}
          <div
            className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-colors ${
              awayWon ? "bg-primary/10 border border-primary/25 shadow-xs" : "bg-slate-900/30"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={match.away_team}
                category={match.category || match.age_group}
                city={match.city || effectiveCity}
                logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 object-contain drop-shadow-md bg-transparent shrink-0"
                className={`text-xs sm:text-sm truncate transition-colors ${
                  awayWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-medium text-slate-400"
                    : "font-bold text-slate-200 hover:text-white"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono font-scoreboard tabular-nums text-sm font-black">
              {isFinished ? (
                <span
                  className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-black ${
                    awayWon
                      ? "bg-done/15 text-done border border-done/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {match.away_score ?? 0}
                </span>
              ) : (
                <span className="text-slate-600 text-xs">-</span>
              )}
            </div>
          </div>

          {/* Set Skorları */}
          {isFinished && match.set_scores && match.set_scores.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Setler:</span>
              {match.set_scores.map((set, sIdx) => {
                const isHomeSet = isHomeSetWin(set);
                return (
                  <span
                    key={sIdx}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-scoreboard tabular-nums font-bold border shadow-xs ${
                      isHomeSet
                        ? "bg-surface-raised text-ink-2 border-line"
                        : "bg-slate-900/90 text-slate-300 border-slate-700/60"
                    }`}
                  >
                    {set}
                  </span>
                );
              })}
              {forfeitInfo.isForfeit && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  (Hükmen)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kart Alt Bilgi: Salon & Volleybox */}
        <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px]">
          {match.hall && match.hall !== "TBD" ? (
            <a
              href={getHallNavigationUrl(match.hall, match.city || effectiveCity)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 min-w-0 truncate text-slate-300 hover:text-white group/hall transition-colors cursor-pointer"
              title={`${match.hall} — Haritada Gör & Yol Tarifi Al`}
            >
              <MapPin size={11} className="text-ink-2 group-hover/hall:scale-110 shrink-0 transition-transform" />
              <span className="truncate underline decoration-slate-600 group-hover/hall:decoration-primary font-medium text-[11px]">
                {match.hall}
              </span>
            </a>
          ) : (
            <span className="text-slate-500 text-[11px]">Salon Belirtilmedi</span>
          )}

          {match.volleybox?.synced ? (
            hasDiff ? (
              <a
                href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 shadow-xs"
              >
                <AlertTriangle size={9} className="text-amber-400" />
                <span>VB Değişti</span>
              </a>
            ) : (
              <a
                href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-xs border ${
                  match.volleybox.has_score
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-700"
                    : isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                    ? "bg-amber-950/80 text-amber-300 border-amber-700"
                    : "bg-slate-800/80 text-slate-300 border-slate-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    match.volleybox.has_score
                      ? "bg-emerald-400 animate-pulse"
                      : isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                      ? "bg-amber-400 animate-ping"
                      : "bg-blue-400"
                  }`}
                ></span>
                <span>
                  VB:{" "}
                  {match.volleybox.score ||
                    (isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                      ? "Skorsuz"
                      : "Kayıtlı")}
                </span>
              </a>
            )
          ) : (
            <span className="text-[9px] text-slate-500">VB: Girilmedi</span>
          )}
        </div>

        {onSelectMatch && (
          <button
            onClick={() => onSelectMatch(match)}
            className="w-full py-2 px-3 rounded-b-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold border-t border-slate-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Maç Merkezi & Setler</span>
            <ChevronRight size={13} className="text-ink-2" />
          </button>
        )}
      </div>
    </React.Fragment>
  );
}
