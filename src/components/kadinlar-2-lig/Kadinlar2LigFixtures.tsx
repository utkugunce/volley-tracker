"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, ExternalLink, CheckCircle2, ChevronRight } from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

interface Kadinlar2LigFixturesProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
}

export const Kadinlar2LigFixtures: React.FC<Kadinlar2LigFixturesProps> = ({
  group,
  searchQuery = "",
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OYNANACAK" | "BİTTİ">("all");

  const matches = group?.fikstur || [];

  // Available weeks in this group
  const weeks = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => {
      if (m.hafta) set.add(m.hafta);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Week filter
      if (selectedWeek !== "all" && m.hafta !== selectedWeek) return false;
      // Status filter
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
        const inCity = m.sehir.toLowerCase().includes(q);
        const inHall = m.salon.toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }
      return true;
    });
  }, [matches, selectedWeek, statusFilter, searchQuery]);

  // Group filtered matches by week
  const matchesByWeek = useMemo(() => {
    const map = new Map<number, Kadinlar2LigMatch[]>();
    filteredMatches.forEach((m) => {
      const w = m.hafta || 1;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMatches]);

  return (
    <div className="space-y-4">
      {/* Filtre ve Hafta Seçici Bar */}
      <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl p-3.5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Hafta Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          <button
            onClick={() => setSelectedWeek("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
              selectedWeek === "all"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                : "bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-800/40"
            }`}
          >
            Tüm Haftalar ({matches.length})
          </button>
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                selectedWeek === w
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-800/40"
              }`}
            >
              {w}. Hafta
            </button>
          ))}
        </div>

        {/* Durum Filtresi: Hepsi / Oynanacak / Bitenler */}
        <div className="flex items-center gap-1 bg-[#181130] p-1 rounded-xl border border-purple-800/40 self-end md:self-auto text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            Hepsi
          </button>
          <button
            onClick={() => setStatusFilter("OYNANACAK")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              statusFilter === "OYNANACAK"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            Oynanacak
          </button>
          <button
            onClick={() => setStatusFilter("BİTTİ")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              statusFilter === "BİTTİ"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            Bitenler
          </button>
        </div>
      </div>

      {/* Maç Listesi */}
      {matchesByWeek.length === 0 ? (
        <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl p-8 text-center text-purple-300/60 text-xs">
          Seçilen kriterlere uygun karşılaşma bulunamadı.
        </div>
      ) : (
        matchesByWeek.map(([weekNum, weekMatches]) => (
          <div key={weekNum} className="space-y-2">
            {/* Hafta Başlığı */}
            <div className="flex items-center justify-between px-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-pink-400" />
                <span>{group.grup_adi} • {weekNum}. Hafta</span>
              </span>
              <span className="text-[11px] font-mono text-purple-400/80">
                {weekMatches.length} Maç
              </span>
            </div>

            {/* Maç Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {weekMatches.map((m) => {
                const isFinished = m.durum === "BİTTİ";
                return (
                  <div
                    key={m.id}
                    className="bg-[#130d29]/90 hover:bg-[#1a1238] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-3.5 transition-all shadow-md hover:shadow-xl backdrop-blur-sm group"
                  >
                    {/* Üst Bilgi: Tarih, Saat, Salon, Şehir */}
                    <div className="flex items-center justify-between text-[11px] text-purple-300/80 border-b border-purple-900/40 pb-2 mb-2.5 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-200">
                          {m.tarih} {m.gun ? `(${m.gun})` : ""}
                        </span>
                        {m.saat && (
                          <span className="flex items-center gap-1 text-purple-400 font-mono">
                            <Clock size={11} />
                            {m.saat}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-purple-400/90 truncate max-w-[200px]" title={`${m.sehir} - ${m.salon}`}>
                        <MapPin size={11} className="shrink-0 text-pink-400" />
                        <span className="truncate">{m.sehir} • {m.salon}</span>
                      </div>
                    </div>

                    {/* Karşılaşma Gövdesi */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Ev Sahibi Takım */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {m.takim_a_logo && !m.takim_a_logo.includes("takimlogoyok") ? (
                            <img
                              src={m.takim_a_logo}
                              alt={m.takim_a}
                              className="w-6 h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-[10px] text-purple-300 font-bold shrink-0">
                              {m.takim_a.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-[13px] text-white truncate block">
                              {m.takim_a}
                            </span>
                            {m.takim_a_volleybox_url && (
                              <a
                                href={m.takim_a_volleybox_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-cyan-400 hover:text-cyan-200 hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Kadro</span>
                                <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Skor veya Durum */}
                      <div className="text-center px-2 shrink-0">
                        {isFinished ? (
                          <div>
                            <div className="text-base sm:text-lg font-black font-mono tracking-wider text-amber-300 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-500/30">
                              {m.skor}
                            </div>
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
                              BİTTİ
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/50">
                              {m.saat || "VS"}
                            </div>
                            <span className="text-[9px] text-purple-400/70 font-semibold uppercase tracking-wider block mt-0.5">
                              OYNANACAK
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Deplasman Takımı */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-[13px] text-white truncate block">
                              {m.takim_b}
                            </span>
                            {m.takim_b_volleybox_url && (
                              <a
                                href={m.takim_b_volleybox_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-cyan-400 hover:text-cyan-200 hover:underline inline-flex items-center gap-0.5 justify-end"
                              >
                                <span>Kadro</span>
                                <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                          {m.takim_b_logo && !m.takim_b_logo.includes("takimlogoyok") ? (
                            <img
                              src={m.takim_b_logo}
                              alt={m.takim_b}
                              className="w-6 h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-[10px] text-purple-300 font-bold shrink-0">
                              {m.takim_b.slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Set Skorları Dökümü (Varsa) */}
                    {m.set_sonuclari && m.set_sonuclari.trim().length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-purple-900/30 flex items-center justify-center gap-1.5 text-[10px] font-mono text-purple-300/80">
                        <span className="text-purple-400/60">Setler:</span>
                        <span className="bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40">
                          {m.set_sonuclari}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
