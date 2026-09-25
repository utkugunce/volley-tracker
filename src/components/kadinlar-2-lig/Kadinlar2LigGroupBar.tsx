"use client";

import React from "react";
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
  return (
    <div className="bg-[#0f0b1e]/90 border-b border-purple-900/30 sticky top-[88px] sm:top-[96px] z-20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider whitespace-nowrap pl-1 pr-2 border-r border-purple-800/40 hidden sm:inline-block">
            GRUPLAR:
          </span>

          {groups.map((g) => {
            const isSelected = selectedGroup === g.grup_no;
            return (
              <button
                key={g.grup_no}
                onClick={() => onSelectGroup(g.grup_no)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30 border border-pink-400/40 scale-102"
                    : "bg-[#181130] text-purple-200/80 hover:text-white hover:bg-purple-900/40 border border-purple-800/30"
                }`}
              >
                <span>Grup {g.grup_no}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-purple-950 text-purple-300"
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
