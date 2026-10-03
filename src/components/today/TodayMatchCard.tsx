"use client";

import React from "react";
import { Clock, ArrowRight, MapPin, Star, ExternalLink, AlertTriangle, Navigation } from "lucide-react";
import type { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { getHallNavigationUrl } from "@/utils/halls";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { isMatchScored } from "@/utils/matchScoring";
import { getScoreText } from "@/utils/todayMatches";

interface TodayMatchCardProps {
  match: Match;
  city: string;
  effectiveYesterdayStr: string;
  isFav: boolean;
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch?: (match: Match) => void;
}

/** Tekil bir maç kartı bileşeni (Dashboard Match Card). */
export function TodayMatchCard({
  match: m,
  city,
  effectiveYesterdayStr,
  isFav,
  onToggleFavorite,
  onSelectMatch,
}: TodayMatchCardProps) {
  const hasScore = isMatchScored(m);
  const isFinished = (m.status === "finished" || hasScore) && hasScore;
  const isYesterdayUnscored = m.date === effectiveYesterdayStr && !hasScore;
  const homeWon = isFinished && (m.home_score ?? 0) > (m.away_score ?? 0);
  const awayWon = isFinished && (m.away_score ?? 0) > (m.home_score ?? 0);
  const disc = m.volleybox?.discrepancy;
  const forfeitInfo = getMatchForfeitInfo(m);

  const homeScoreText = getScoreText(m, "home");
  const awayScoreText = getScoreText(m, "away");

  return (
    <div
      key={m.id}
      className={`glass-card rounded-2xl border transition-all duration-300 shadow-card hover:shadow-card-hover flex flex-col justify-between overflow-hidden group ${
        disc?.has_diff
          ? "border-amber-500/60 ring-1 ring-amber-400/30"
          : isFav
          ? "border-amber-500/60 ring-1 ring-amber-400/40"
          : isYesterdayUnscored
          ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60"
          : "border-slate-800 hover:border-slate-600/80"
      }`}
    >
      {/* Kart Üst Bilgi Başlığı */}
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {isYesterdayUnscored && (
            <span className="font-bold px-1.5 py-0.5 rounded-md bg-amber-950/90 border border-amber-700/60 text-amber-300 text-[10px] tracking-wide">
              Dün
            </span>
          )}
          {m.city && city === "Tüm İller" && (
            <span className="font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 text-[10px] uppercase tracking-wider">
              {m.city}
            </span>
          )}
          <LeagueVolleyboxLink
            league={m.category}
            city={m.city || (city !== "Tüm İller" ? city : undefined)}
            className="font-bold text-slate-200 hover:text-amber-400 truncate text-[11px] tracking-wide"
          >
            {m.category}
          </LeagueVolleyboxLink>
          <span className="text-slate-600 text-[10px]">•</span>
          <span className="text-slate-400 text-[11px]">{m.group}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isFinished ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider border shadow-xs flex items-center gap-1 ${
              forfeitInfo.isForfeit
                ? "bg-amber-950/90 text-amber-300 border-amber-500/40"
                : "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${forfeitInfo.isForfeit ? "bg-amber-400" : "bg-emerald-400"}`} />
              {forfeitInfo.isForfeit ? "HÜKMEN" : "BİTTİ"}
            </span>
          ) : isYesterdayUnscored ? (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs"
              title="Dün oynandı, il temsilciliğinden skor girişi bekleniyor"
            >
              <Clock size={10} className="text-amber-400" />
              <span>DÜN • SKOR BEKLENİYOR</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-sky-950/90 text-sky-300 border border-sky-500/40 flex items-center gap-1 shadow-xs">
              <Clock size={10} className="text-sky-400" />
              <span className="font-mono font-scoreboard tabular-nums">{m.time}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite(m.id)}
            className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-90"
            title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            aria-label={isFav ? `${m.home_team} - ${m.away_team} maçını favorilerden çıkar` : `${m.home_team} - ${m.away_team} maçını favorilere ekle`}
          >
            <Star size={14} aria-hidden="true" className={isFav ? "fill-amber-400 text-amber-400" : ""} />
          </button>
        </div>
      </div>

      {/* Skorboard / Takım Alanı */}
      <div className="p-4 space-y-2.5">
        {/* Ev Sahibi Takım */}
        <div className={`flex items-center justify-between gap-3 p-1 rounded-xl transition-all ${
          homeWon ? "bg-white/[0.03] border-l-2 border-primary pl-2.5" : ""
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <TeamVolleyboxLink
              teamName={m.home_team}
              category={m.category || m.age_group}
              city={m.city || (city === "Tüm İller" ? undefined : city)}
              logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 rounded-xl p-1 shadow-md"
              className={`text-sm transition-colors group-hover:text-white ${
                homeWon
                  ? "font-black text-white"
                  : isFinished
                  ? "font-medium text-slate-400"
                  : "font-bold text-slate-200"
              }`}
            />
          </div>
          <div className="shrink-0 font-mono font-scoreboard tabular-nums text-base font-black">
            {isFinished ? (
              <span
                className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm transition-all ${
                  homeWon
                    ? "text-done font-black"
                    : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                }`}
              >
                {homeScoreText}
              </span>
            ) : (
              <span className="text-slate-600 text-xs font-normal">--</span>
            )}
          </div>
        </div>

        {/* Deplasman Takımı */}
        <div className={`flex items-center justify-between gap-3 p-1 rounded-xl transition-all ${
          awayWon ? "bg-white/[0.03] border-l-2 border-primary pl-2.5" : ""
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <TeamVolleyboxLink
              teamName={m.away_team}
              category={m.category || m.age_group}
              city={m.city || (city === "Tüm İller" ? undefined : city)}
              logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 rounded-xl p-1 shadow-md"
              className={`text-sm transition-colors group-hover:text-white ${
                awayWon
                  ? "font-black text-white"
                  : isFinished
                  ? "font-medium text-slate-400"
                  : "font-bold text-slate-200"
              }`}
            />
          </div>
          <div className="shrink-0 font-mono font-scoreboard tabular-nums text-base font-black">
            {isFinished ? (
              <span
                className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm transition-all ${
                  awayWon
                    ? "text-done font-black"
                    : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                }`}
              >
                {awayScoreText}
              </span>
            ) : (
              <span className="text-slate-600 text-xs font-normal">--</span>
            )}
          </div>
        </div>

        {/* Set Skorları */}
        {isFinished && m.set_scores && m.set_scores.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Setler:</span>
            {m.set_scores.map((set, sIdx) => (
              <span
                key={sIdx}
                className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-200 text-[10px] font-mono font-scoreboard tabular-nums font-bold border border-slate-700/60 shadow-xs"
              >
                {set}
              </span>
            ))}
            {forfeitInfo.isForfeit && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                (Hükmen)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kart Alt Bilgi: Salon & Volleybox */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2">
        {m.hall && m.hall !== "TBD" ? (
          <a
            href={getHallNavigationUrl(m.hall, m.city || (city === "Tüm İller" ? undefined : city))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 min-w-0 truncate text-slate-300 hover:text-white group/hall transition-colors cursor-pointer"
            title={`${m.hall} — Haritada Gör & Yol Tarifi Al`}
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin size={12} className="text-ink-2 group-hover/hall:scale-110 shrink-0 transition-transform" />
            <span className="truncate underline decoration-slate-600 group-hover/hall:decoration-primary font-medium">
              {m.hall}
            </span>
            <Navigation size={10} className="text-slate-400 group-hover/hall:text-ink-2 shrink-0" />
          </a>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 min-w-0 truncate">
            <MapPin size={12} className="shrink-0" />
            <span>Salon Belirtilmedi</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {disc?.has_diff && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-700/60 shadow-xs"
              title={`Bülten değişikliği tespit edildi! (${disc.details || "Saat/Salon farklı"})`}
            >
              <AlertTriangle size={10} className="text-amber-400" />
              <span>Değişti</span>
            </span>
          )}
          {m.volleybox?.url ? (
            <a
              href={m.volleybox.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-sky-400 hover:text-sky-300 transition-colors bg-sky-950/40 hover:bg-sky-900/60 px-2 py-0.5 rounded-md border border-sky-800/40 text-[10px]"
              title="Volleybox maç kaydına git"
            >
              <span>Volleybox</span>
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-[10px] text-slate-600 font-medium">VB Girişi Yok</span>
          )}
        </div>

        {onSelectMatch && (
          <button
            onClick={() => onSelectMatch(m)}
            className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold border-t border-slate-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Maç Merkezi & Setler</span>
            <ArrowRight size={12} className="text-ink-2" />
          </button>
        )}
      </div>
    </div>
  );
}
