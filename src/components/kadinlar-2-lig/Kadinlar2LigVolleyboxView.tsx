"use client";

import React, { useMemo } from "react";
import { ExternalLink, Trophy, Calendar, Sparkles } from "lucide-react";
import { Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { Kadinlar2LigVolleyboxCard } from "./Kadinlar2LigVolleyboxCard";
import { normalizeK2Date, isKadinlar2LigMatchFavorite } from "@/utils/kadinlar2LigConverter";

interface Kadinlar2LigVolleyboxViewProps {
  matches: Kadinlar2LigMatch[];
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string | null;
  isFavorite: (teamName: string) => boolean;
  onToggleFavorite?: (matchId: string) => void;
  selectedDate: string;
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function formatTurkishDateHeader(isoDate: string): string {
  if (!isoDate || isoDate === "TBD" || isoDate === "all") return "";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  const monthName = MONTH_NAMES[month - 1] || "";
  const dayName = DAY_NAMES[d.getDay()] || "";
  return `${day} ${monthName} ${year}, ${dayName}`;
}

/**
 * Volleybox.net üzerindeki resmi maç sıralama motoru:
 * 1. Karşılaşma saati (saat artan: 08:00, 10:00, 11:00...)
 * 2. Aynı saatteki karşılaşmalar için Volleybox match_id numerik artan
 * 3. Fallback: Grup numarası ve maç numarası
 */
export function sortMatchesInVolleyboxOrder(matches: Kadinlar2LigMatch[]): Kadinlar2LigMatch[] {
  return [...matches].sort((a, b) => {
    // 1. Saat (örn: "11:00", "13:00")
    const timeA = a.saat || "99:99";
    const timeB = b.saat || "99:99";
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    // 2. Volleybox match_id (numerik artan)
    const idA = a.volleybox?.match_id ? Number(a.volleybox.match_id) : 99999999;
    const idB = b.volleybox?.match_id ? Number(b.volleybox.match_id) : 99999999;
    if (idA !== idB) {
      return idA - idB;
    }

    // 3. Fallback: grup_no ve mac_no
    const gA = a.grup_no || 99;
    const gB = b.grup_no || 99;
    if (gA !== gB) return gA - gB;
    return (Number(a.mac_no) || 0) - (Number(b.mac_no) || 0);
  });
}

export const Kadinlar2LigVolleyboxView: React.FC<Kadinlar2LigVolleyboxViewProps> = ({
  matches,
  onSelectMatch,
  selectedMatchId,
  isFavorite,
  onToggleFavorite,
  selectedDate,
}) => {
  // Karşılaşmaları tarihe göre grupla (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Kadinlar2LigMatch[]>();

    matches.forEach((m) => {
      const iso = normalizeK2Date(m.tarih);
      if (!map.has(iso)) {
        map.set(iso, []);
      }
      map.get(iso)!.push(m);
    });

    // Tarihleri en yeniden en eskiye sırala
    const sortedDates = Array.from(map.keys()).sort().reverse();

    return sortedDates.map((dateIso) => {
      const dayMatches = map.get(dateIso) || [];
      // Her günün maçlarını Volleybox sırasına diz
      const orderedMatches = sortMatchesInVolleyboxOrder(dayMatches);
      return {
        dateIso,
        dateFormatted: formatTurkishDateHeader(dateIso),
        matches: orderedMatches,
      };
    });
  }, [matches]);

  if (groupedByDate.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {groupedByDate.map(({ dateIso, dateFormatted, matches: dayMatches }) => {
        const vbDailyUrl = `https://women.volleybox.net/tr/matches?date=${dateIso}`;
        const vbTournamentUrl =
          "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047/matches";

        return (
          <div key={dateIso} className="space-y-3.5">
            {/* Volleybox Gün Başlığı (https://women.volleybox.net/tr/matches birebir taklit) */}
            <div className="glass-panel border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-850/80 shadow-card flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                  <Trophy size={18} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                      Uzman Posta Kadınlar Voleybol 2. Ligi 2026/27
                    </h3>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles size={10} />
                      Volleybox Sırası
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                    <Calendar size={12} className="text-slate-500" />
                    <span>{dateFormatted || dateIso}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-300">
                      {dayMatches.length} Karşılaşma
                    </span>
                  </div>
                </div>
              </div>

              {/* Volleybox Dış Bağlantıları */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={vbDailyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
                  title="Bu tarihin maçlarını Volleybox.net üzerinde aç"
                >
                  <ExternalLink size={12} />
                  <span>Volleybox&apos;ta Aç</span>
                </a>
              </div>
            </div>

            {/* Günün Maçları Listesi (Volleybox sıralı) */}
            <div className="grid grid-cols-1 gap-2.5">
              {dayMatches.map((m) => {
                const isFav = isKadinlar2LigMatchFavorite(m, isFavorite);
                return (
                  <Kadinlar2LigVolleyboxCard
                    key={m.id}
                    match={m}
                    isSelected={selectedMatchId === m.id}
                    onSelect={onSelectMatch}
                    isFavorite={isFav}
                    onToggleFavorite={onToggleFavorite}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
