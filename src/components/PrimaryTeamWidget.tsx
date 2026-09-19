"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Match } from "@/types/fixture";
import { TeamBadge } from "./TeamBadge";
import {
  Star,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  Trophy,
  X,
} from "lucide-react";
import { slugify } from "@/utils/slugify";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { generateMatchIcs, downloadIcsFile } from "@/utils/ics";
import { triggerHaptic } from "@/utils/haptics";

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
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

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
    const lower = primaryTeam.toLowerCase().trim();
    return matches.filter(
      (m) =>
        m.home_team.toLowerCase().trim() === lower ||
        m.away_team.toLowerCase().trim() === lower
    );
  }, [matches, primaryTeam]);

  // Sıradaki maç
  const nextMatch = useMemo(() => {
    return teamMatches.find(
      (m) => m.status !== "finished" && m.date && m.date !== "TBD"
    );
  }, [teamMatches]);

  // Son tamamlanan maç
  const lastFinishedMatch = useMemo(() => {
    const finished = teamMatches.filter((m) => m.status === "finished");
    return finished[finished.length - 1];
  }, [teamMatches]);

  // Geri sayım
  useEffect(() => {
    if (!nextMatch || !nextMatch.date || nextMatch.date === "TBD") {
      setCountdown(null);
      return;
    }

    const calcTime = () => {
      try {
        const timeStr = nextMatch.time && nextMatch.time !== "--:--" ? nextMatch.time : "12:00";
        const target = new Date(`${nextMatch.date}T${timeStr}:00`).getTime();
        const diff = target - Date.now();

        if (diff <= 0) {
          setCountdown(null);
        } else {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          });
        }
      } catch {
        setCountdown(null);
      }
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);

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
    const q = searchQuery.toLowerCase().trim();
    return list.filter((t) => t.toLowerCase().includes(q)).slice(0, 24);
  }, [availableTeams, matches, searchQuery]);

  // Eğer takım seçilmediyse şık davet kartı göster
  if (!primaryTeam) {
    return (
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-800/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <Star size={16} className="fill-amber-400" />
          </div>
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">
              Kulübünüzü Takip Edin
            </div>
            <div className="text-slate-400 text-[11px]">
              Desteklediğiniz altyapı kulübünü seçin; sonraki maçını ve canlı sonuçlarını en üstte görüntüleyin.
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPicking(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all shadow-glow-red shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <span>Kulüp Seç</span>
        </button>

        {/* Takım Seçim Modalı */}
        {isPicking && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsPicking(false)}
          >
            <div
              className="bg-[#0b1325] border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <span>Favori Kulübünüzü Seçin</span>
                </h3>
                <button
                  onClick={() => setIsPicking(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kulüp adı ara (örn: Fenerbahçe, VakıfBank)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
                {candidateTeams.map((team) => {
                  const mapping = getVolleyboxMapping(team, undefined, undefined, city);
                  const logo = mapping?.local_logo || mapping?.logo_url;
                  return (
                    <button
                      key={team}
                      onClick={() => handleSetPrimaryTeam(team)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <TeamBadge name={team} logoUrl={logo} size="sm" />
                      <span className="text-xs font-bold text-slate-200 truncate flex-1">
                        {team}
                      </span>
                      <ChevronRight size={13} className="text-slate-500" />
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

  // Birincil takım seçildiyse: VIP Kartı
  const mapping = getVolleyboxMapping(primaryTeam, undefined, undefined, city);
  const teamLogo = mapping?.local_logo || mapping?.logo_url;
  const teamSlug = slugify(mapping?.matched_as || primaryTeam);

  const opponent = nextMatch
    ? nextMatch.home_team.toLowerCase() === primaryTeam.toLowerCase()
      ? nextMatch.away_team
      : nextMatch.home_team
    : null;

  const opponentMapping = opponent ? getVolleyboxMapping(opponent, undefined, undefined, city) : null;
  const opponentLogo = opponentMapping?.local_logo || opponentMapping?.logo_url;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-card relative overflow-hidden space-y-3.5">
      {/* Arka Plan Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Üst Bar: Kulüp Başlığı & Değiştir */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamBadge name={primaryTeam} logoUrl={teamLogo} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Kulübüm
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {teamMatches.length} Maç Kaydı
              </span>
            </div>
            <Link
              href={`/takim/${teamSlug}`}
              className="font-black text-sm sm:text-base text-white hover:text-primary transition-colors truncate block"
            >
              {primaryTeam}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <Link
            href={`/takim/${teamSlug}`}
            className="hidden sm:inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[11px] font-semibold"
          >
            <span>Takım Profili</span>
            <ArrowRight size={11} />
          </Link>
          <button
            onClick={() => handleSetPrimaryTeam(null)}
            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
            title="Kulüp seçimini kaldır"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. Orta Kısım: Sıradaki Maç & Canlı Geri Sayım */}
      {nextMatch ? (
        <div
          onClick={() => onSelectMatch?.(nextMatch)}
          className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1424] to-slate-900/90 border border-slate-800 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-all shadow-inner group"
        >
          {/* Sol: Rakip ve Maç Bilgisi */}
          <div className="flex items-center gap-3 min-w-0">
            {opponent && <TeamBadge name={opponent} logoUrl={opponentLogo} size="md" />}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                Sıradaki Maç • {nextMatch.category}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white truncate">
                vs {opponent}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>🗓 {nextMatch.date}</span>
                <span>⏰ {nextMatch.time}</span>
                <span className="truncate hidden sm:inline">📍 {nextMatch.hall}</span>
              </div>
            </div>
          </div>

          {/* Sağ: Geri Sayım Sayacı */}
          {countdown && (
            <div className="flex items-center gap-1.5 shrink-0 font-scoreboard self-end md:self-auto">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-1 text-center min-w-[36px]">
                <span className="text-xs sm:text-sm font-black text-white">{countdown.days}</span>
                <span className="text-[8px] text-slate-500 block uppercase font-sans">Gün</span>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-1 text-center min-w-[36px]">
                <span className="text-xs sm:text-sm font-black text-white">{countdown.hours}</span>
                <span className="text-[8px] text-slate-500 block uppercase font-sans">Saat</span>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-1 text-center min-w-[36px]">
                <span className="text-xs sm:text-sm font-black text-white">{countdown.minutes}</span>
                <span className="text-[8px] text-slate-500 block uppercase font-sans">Dak</span>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2 py-1 text-center min-w-[36px]">
                <span className="text-xs sm:text-sm font-black text-amber-400">{countdown.seconds}</span>
                <span className="text-[8px] text-slate-500 block uppercase font-sans">Sn</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400">
          Bu kulübün bültende bekleyen yaklaşan maçı bulunmuyor.
        </div>
      )}

      {/* 3. Son Karşılaşma Skoru (Varsa) */}
      {lastFinishedMatch && (
        <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Son Maç:</span>
            <span className="text-slate-200 font-semibold">
              {lastFinishedMatch.home_team} {lastFinishedMatch.score} {lastFinishedMatch.away_team}
            </span>
          </div>

          <button
            onClick={() => onSelectMatch?.(lastFinishedMatch)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Detay</span>
            <ChevronRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
