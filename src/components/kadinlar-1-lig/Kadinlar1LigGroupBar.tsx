"use client";

import React from "react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { triggerHaptic } from "@/utils/haptics";

interface Kadinlar1LigGroupBarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number | "all";
  onSelectGroup: (groupNo: number | "all") => void;
  className?: string;
}

export const Kadinlar1LigGroupBar: React.FC<Kadinlar1LigGroupBarProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  className = "",
}) => {
  return (
    <div
      className={`bg-surface border border-line rounded-xl p-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs ${className}`}
      role="region"
      aria-label="KFC Kadınlar 1. Ligi Grup Seçimi"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider px-2 py-1 hidden sm:inline">
          Grup:
        </span>

        {groups.map((group) => {
          const isSelected = selectedGroup === group.grup_no;
          const label = group.grup_adi || (group.grup_no === 1 ? "A Grubu" : "B Grubu");

          return (
            <button
              key={group.grup_no}
              type="button"
              onClick={() => {
                triggerHaptic();
                onSelectGroup(group.grup_no);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-primary-fg shadow-xs font-bold"
                  : "bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line/60"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-black/20 text-white" : "bg-surface text-ink-3"
                }`}
              >
                {group.takim_sayisi} Takım
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onSelectGroup("all");
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedGroup === "all"
              ? "bg-primary text-primary-fg shadow-xs font-bold"
              : "bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line/60"
          }`}
        >
          <span>Tüm Gruplar</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              selectedGroup === "all" ? "bg-black/20 text-white" : "bg-surface text-ink-3"
            }`}
          >
            28 Takım
          </span>
        </button>
      </div>

      <div className="text-[11px] text-ink-3 font-mono px-2 shrink-0 hidden md:inline">
        İlk 4 Yarı Final &bull; Son 2 Düşme
      </div>
    </div>
  );
};
