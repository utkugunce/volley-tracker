"use client";

import React, { useRef } from "react";
import { Layers } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";

interface Kadinlar2LigGroupBarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number;
  onSelectGroup: (groupNo: number) => void;
}

export const Kadinlar2LigGroupBar: React.FC<Kadinlar2LigGroupBarProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-[#070d19]/90 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-4 py-1.5 shadow-sm sticky top-[82px] sm:top-[88px] z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Grup sekmeleri"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 border-r border-slate-800 shrink-0">
            <Layers size={13} className="text-rose-400" />
            <span>Gruplar:</span>
          </div>

          {groups.map((g) => {
            const isSelected = selectedGroup === g.grup_no;
            return (
              <button
                key={g.grup_no}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectGroup(g.grup_no)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border focus:outline-none ${
                  isSelected
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-glow-red font-bold ring-1 ring-red-500/40"
                    : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border-slate-800/80"
                }`}
                title={`Kadınlar 2. Ligi ${g.grup_adi} Puan Durumu ve Fikstürü`}
              >
                <span>Grup {g.grup_no}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {g.takim_sayisi}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
