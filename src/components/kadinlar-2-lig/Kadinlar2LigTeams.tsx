"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Search, Shield, Trophy, ArrowRight, User } from "lucide-react";
import { Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";

interface Kadinlar2LigTeamsProps {
  teams: Kadinlar2LigTeam[];
  onSelectGroup?: (groupNo: number) => void;
  searchQuery?: string;
}

export const Kadinlar2LigTeams: React.FC<Kadinlar2LigTeamsProps> = ({
  teams,
  onSelectGroup,
  searchQuery = "",
}) => {
  const [filterGroup, setFilterGroup] = useState<number | "all">("all");

  const filteredTeams = teams.filter((t) => {
    if (filterGroup !== "all" && t.grup_no !== filterGroup) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.takim_adi.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Üst Bilgi Kartı */}
      <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <span>Kadınlar 2. Ligi Kulüpleri</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700/50 text-purple-300 font-mono">
              {filteredTeams.length} / {teams.length} Takım
            </span>
          </h2>
          <p className="text-xs text-purple-300/70">
            Tüm kulüplerin resmi TVF grup bilgileri ve Volleybox oyuncu/teknik ekip kadroları
          </p>
        </div>

        {/* Grup Filtresi Dropdown */}
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="bg-[#1a1236] border border-purple-800/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="all">Tüm Gruplar (1-16)</option>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>
              Grup {g}
            </option>
          ))}
        </select>
      </div>

      {/* Takım Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredTeams.map((team, idx) => (
          <div
            key={team.takim_id || idx}
            className="bg-[#130d29]/90 hover:bg-[#1b123d] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-3.5 transition-all shadow-md hover:shadow-xl backdrop-blur-sm flex flex-col justify-between gap-3 group"
          >
            <div className="flex items-start gap-3">
              <Link
                href={`/takim/${slugify(team.takim_adi)}`}
                className="shrink-0 hover:opacity-85 transition-opacity"
                title={`${team.takim_adi} Kulüp Profili`}
              >
                {team.logo && !team.logo.includes("takimlogoyok") ? (
                  <Image
                    src={team.logo}
                    alt={team.takim_adi}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain rounded-xl shrink-0 bg-white/5 p-1 border border-purple-800/30 group-hover:scale-105 transition-transform"
                    unoptimized={team.logo.startsWith("http")}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-xs text-purple-200 font-bold shrink-0 group-hover:border-pink-500 transition-colors">
                    {team.takim_adi.slice(0, 2)}
                  </div>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    onClick={() => onSelectGroup && onSelectGroup(team.grup_no)}
                    className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-950 text-purple-300 border border-purple-800/40 font-mono font-bold cursor-pointer hover:bg-purple-800 transition-colors"
                    title={`Grup ${team.grup_no}'e git`}
                  >
                    Grup {team.grup_no}
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] font-mono text-purple-400">
                    Sıra: {team.sira}
                  </span>
                </div>
                <Link
                  href={`/takim/${slugify(team.takim_adi)}`}
                  className="font-bold text-xs sm:text-[13px] text-white group-hover:text-pink-300 transition-colors line-clamp-2 block hover:underline underline-offset-2"
                  title={`${team.takim_adi} Kulüp Profilini Aç`}
                >
                  {team.takim_adi}
                </Link>
              </div>
            </div>

            {/* Alt Kısım: Puan İstatistiği & Profil / Volleybox Butonları */}
            <div className="flex items-center justify-between pt-2 border-t border-purple-900/30 text-xs gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300/80 font-mono">
                <span className="text-emerald-400 font-bold">{team.g}G</span>
                <span>•</span>
                <span className="text-rose-400">{team.m}M</span>
                <span>•</span>
                <span className="text-amber-300 font-extrabold">{team.p}P</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/takim/${slugify(team.takim_adi)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-700/50 text-[11px] font-semibold transition-all shadow-xs"
                  title={`${team.takim_adi} Kulüp Profilini Aç`}
                >
                  <span>Profil</span>
                  <ArrowRight size={10} />
                </Link>

                {team.volleybox_url ? (
                  <a
                    href={team.volleybox_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/50 text-[11px] font-semibold transition-all shadow-xs"
                    title={`${team.takim_adi} Volleybox Kadro Profili`}
                  >
                    <span>Kadro</span>
                    <ExternalLink size={10} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
