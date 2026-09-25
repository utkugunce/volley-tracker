"use client";

import React from "react";
import { Trophy, ArrowRight, Shield, Calendar } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";

interface Kadinlar2LigLeadersProps {
  groups: Kadinlar2LigGroup[];
  onSelectGroup: (groupNo: number) => void;
}

export const Kadinlar2LigLeaders: React.FC<Kadinlar2LigLeadersProps> = ({
  groups,
  onSelectGroup,
}) => {
  return (
    <div className="space-y-4">
      {/* Üst Bilgi Başlığı */}
      <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <span>16 Grup Genel Bakış & Liderler</span>
          </h2>
          <p className="text-xs text-purple-300/70">
            Tüm 16 grubun lider takımları ve detaylı puan cetveli / fikstürüne hızlı geçiş
          </p>
        </div>
      </div>

      {/* 16 Grup Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {groups.map((group) => {
          const topTeams = group.puan_durumu.slice(0, 3);
          const firstTeam = topTeams[0];

          return (
            <div
              key={group.grup_no}
              className="bg-[#130d29]/90 hover:bg-[#1a1238] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 transition-all shadow-md hover:shadow-xl backdrop-blur-sm flex flex-col justify-between gap-3 group"
            >
              {/* Başlık: Grup No & Takım/Maç Sayısı */}
              <div>
                <div className="flex items-center justify-between border-b border-purple-900/30 pb-2 mb-2.5">
                  <span className="font-extrabold text-sm text-white group-hover:text-pink-300 transition-colors">
                    {group.grup_adi}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300">
                    <span className="bg-purple-950 px-1.5 py-0.5 rounded-md border border-purple-800/40">
                      {group.takim_sayisi} Takım
                    </span>
                    <span className="bg-purple-950 px-1.5 py-0.5 rounded-md border border-purple-800/40">
                      {group.mac_sayisi} Maç
                    </span>
                  </div>
                </div>

                {/* İlk 3 Takım Listesi */}
                <div className="space-y-1.5">
                  {topTeams.map((t, idx) => (
                    <div
                      key={t.takim_id || idx}
                      className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition-colors ${
                        idx === 0
                          ? "bg-amber-950/20 border border-amber-500/20"
                          : "bg-purple-950/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0
                              ? "bg-amber-500/30 text-amber-300"
                              : idx === 1
                              ? "bg-purple-500/30 text-purple-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 truncate text-[11px] block">
                          {t.takim_adi}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-300 text-xs shrink-0 pl-1">
                        {t.p} P
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gruba Git Butonu */}
              <button
                onClick={() => onSelectGroup(group.grup_no)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white border border-purple-700/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer mt-1"
              >
                <span>Grup {group.grup_no} Detayları</span>
                <ArrowRight size={13} className="text-pink-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
