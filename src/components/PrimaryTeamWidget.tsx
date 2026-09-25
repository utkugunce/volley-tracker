"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Match } from "@/types/fixture";
import { TeamBadge } from "./TeamBadge";
import {
  Star,
  Clock,
  Calendar,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import { slugify } from "@/utils/slugify";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { triggerHaptic } from "@/utils/haptics";
import { trLower, trIncludes } from "@/utils/turkishLocale";

interface PrimaryTeamWidgetProps {
  matches: Match[];
  city?: string;
  onSelectMatch?: (match: Match) => void;
  availableTeams?: string[];
}

export const PrimaryTeamWidget: React.FC<PrimaryTeamWidgetProps> = ({
  matches = [],
  city = "İstanbul",
  onSelectMatch,
  availableTeams = [],
}) => {
  const [primaryTeam, setPrimaryTeam] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  // localStorage'dan kayıtlı birincil takımı oku
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvf_primary_team");
      if (saved) {
        setPrimaryTeam(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetPrimaryTeam = (teamName: string | null) => {
    triggerHaptic("success");
    setPrimaryTeam(teamName);
    setIsPicking(false);
    try {
      if (teamName) {
        localStorage.setItem("tvf_primary_team", teamName);
      } else {
        localStorage.removeItem("tvf_primary_team");
      }
    } catch {
      // ignore
    }
  };

  // Birincil takıma ait maçlar
  const teamMatches = useMemo(() => {
    if (!primaryTeam) return [];
    const lower = trLower(primaryTeam).trim();
    return matches.filter(
      (m) =>
        trLower(m.home_team).trim() === lower ||
        trLower(m.away_team).trim() === lower
    );
  }, [matches, primaryTeam]);

  // Sıradaki maç
  const nextMatch = useMemo(() => {
    return teamMatches.find(
      (m) => m.status !== "finished" && m.date && m.date !== "TBD"
    );
  }, [teamMatches]);

  // Takım listesi (Arama için)
  const candidateTeams = useMemo(() => {
    const list =
      availableTeams.length > 0
        ? availableTeams
        : Array.from(new Set(matches.flatMap((m) => [m.home_team, m.away_team]))).filter(
            Boolean
          );
    list.sort((a, b) => a.localeCompare(b, "tr"));
    if (!searchQuery.trim()) return list.slice(0, 24);
    const q = trLower(searchQuery).trim();
    return list.filter((t) => trIncludes(t, q)).slice(0, 24);
  }, [availableTeams, matches, searchQuery]);

  // Takım seçilmediyse ve kapatılmadıysa: Minimal, tek satırlık şık davet çubuğu
  if (!primaryTeam) {
    if (isDismissed) return null;
    return (
      <div className="bg-[#0f172a]/60 hover:bg-[#0f172a]/80 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-xs transition-colors shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Star size={13} className="text-amber-400 fill-amber-400/20 shrink-0" />
          <span className="font-bold text-white text-[11px] shrink-0">
            Kulübünüzü Takip Edin
          </span>
          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
            • Desteklediğiniz altyapı kulübünün sıradaki maçını tek bakışta görün.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPicking(true)}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Kulüp Seç
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-500 hover:text-slate-300 p-0.5"
            title="Kapat"
          >
            <X size={12} />
          </button>
        </div>

        {/* Takım Seçim Modalı */}
        {isPicking && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsPicking(false)}
          >
            <div
              className="bg-[#0b1325] border border-slate-700 rounded-2xl p-4 max-w-md w-full shadow-2xl space-y-3 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>Favori Kulübünüzü Seçin</span>
                </h3>
                <button
                  onClick={() => setIsPicking(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kulüp adı ara (örn: Fenerbahçe, VakıfBank, Zeren)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-[200px]">
                {candidateTeams.map((team) => {
                  const mapping = getVolleyboxMapping(team, undefined, undefined, city);
                  const logo = mapping?.local_logo || mapping?.logo_url;
                  return (
                    <button
                      key={team}
                      onClick={() => handleSetPrimaryTeam(team)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <TeamBadge name={team} logoUrl={logo} size="xs" />
                      <span className="text-xs font-bold text-slate-200 truncate flex-1">
                        {team}
                      </span>
                      <ChevronRight size={12} className="text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Birincil takım seçildiyse: Ultra-kompakt VIP Şerit
  const mapping = getVolleyboxMapping(primaryTeam, undefined, undefined, city);
  const teamLogo = mapping?.local_logo || mapping?.logo_url;
  const teamSlug = slugify(mapping?.matched_as || primaryTeam);

  const opponent = nextMatch
    ? trLower(nextMatch.home_team) === trLower(primaryTeam)
      ? nextMatch.away_team
      : nextMatch.home_team
    : null;
  const opponentMapping = opponent ? getVolleyboxMapping(opponent, undefined, undefined, city) : null;
  const opponentLogo = opponentMapping?.local_logo || opponentMapping?.logo_url;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0d172a] to-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      {/* Sol: Kulüp Bilgisi */}
      <div className="flex items-center gap-2.5 min-w-0">
        <TeamBadge name={primaryTeam} logoUrl={teamLogo} size="xs" />
        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Kulübüm
          </span>
          <Link
            href={`/takim/${teamSlug}`}
            className="font-bold text-white hover:text-amber-300 transition-colors truncate"
          >
            {primaryTeam}
          </Link>
        </div>
      </div>

      {/* Orta / Sağ: Sıradaki Maç Özeti */}
      {nextMatch ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMatch?.(nextMatch)}
          className="flex items-center gap-2 cursor-pointer hover:text-rose-200 transition-colors bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded-lg self-start sm:self-auto"
        >
          <span className="text-[10px] font-bold text-sky-400 uppercase">Sıradaki:</span>
          {opponent && <TeamBadge name={opponent} logoUrl={opponentLogo} size="xs" />}
          <span className="font-bold text-white truncate max-w-[140px]">vs {opponent}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {nextMatch.date} {nextMatch.time}
          </span>
          <ChevronRight size={11} className="text-slate-500" />
        </div>
      ) : (
        <div className="text-[11px] text-slate-500 font-medium">
          Bekleyen maç bulunmuyor
        </div>
      )}

      {/* Sağ: İptal / Değiştir */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => handleSetPrimaryTeam(null)}
          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
          title="Kulüp seçimini kaldır"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
