"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Layers } from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

interface Kadinlar2LigGroupBarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number | "all";
  onSelectGroup: (groupNo: number | "all") => void;
  allMatches?: Kadinlar2LigMatch[];
}

export const Kadinlar2LigGroupBar: React.FC<Kadinlar2LigGroupBarProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  allMatches,
}) => {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAll = selectedGroup === "all";
  const currentGroup = isAll
    ? null
    : groups.find((g) => g.grup_no === selectedGroup) || groups[0];

  const totalTeams = groups.reduce((sum, g) => sum + (g.takim_sayisi || 0), 0);
  const totalMatches =
    allMatches?.length || groups.reduce((sum, g) => sum + (g.mac_sayisi || 0), 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGroupDropdownOpen) {
        setIsGroupDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGroupDropdownOpen]);

  const handleGroupSelect = (groupNo: number | "all") => {
    onSelectGroup(groupNo);
    setIsGroupDropdownOpen(false);
  };

  return (
    <div
      className={`bg-surface p-3.5 sm:p-4 rounded-xl border border-line no-print space-y-3 relative ${
        isGroupDropdownOpen ? "z-30" : "z-10"
      }`}
    >
      {/* 1. ÜST BAR: GRUP SEÇİMİ DROPDOWN MENÜSÜ & ÖZET BİLGİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-bold text-ink-3 uppercase flex items-center gap-1.5 shrink-0">
            <Layers size={13} className="text-primary shrink-0" />
            GRUP:
          </span>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              aria-expanded={isGroupDropdownOpen}
              aria-haspopup="listbox"
              aria-label={
                isAll
                  ? "Kadınlar 2. Ligi Tüm Gruplar"
                  : currentGroup
                  ? `Kadınlar 2. Ligi ${currentGroup.grup_adi}`
                  : "Grup Seçiniz"
              }
              className="flex items-center justify-between gap-2.5 bg-surface-muted hover:bg-surface-raised text-ink text-xs font-bold px-3 py-1.5 rounded-lg border border-line transition-colors cursor-pointer min-w-[210px] sm:min-w-[240px]"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-ink font-bold truncate text-xs">
                  {isAll
                    ? "Tüm Gruplar (16 Grup)"
                    : currentGroup?.grup_adi || `${selectedGroup}. Grup`}
                </span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0 text-ink-3">
                <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-surface border border-line text-ink-2">
                  {isAll ? `${totalTeams} Takım` : `${currentGroup?.takim_sayisi || 0} Takım`}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-ink-3 ${
                    isGroupDropdownOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </div>
            </button>

            {isGroupDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface border border-line-strong rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2.5 border-b border-line bg-surface-muted flex items-center justify-between text-[11px] font-bold text-ink-2">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-primary" />
                    <span>Kadınlar 2. Ligi Grupları</span>
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-ink-3">
                    16 Grup · {totalTeams} Takım
                  </span>
                </div>

                <div
                  className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
                  role="listbox"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isAll}
                    onClick={() => handleGroupSelect("all")}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isAll
                        ? "bg-primary/15 text-ink font-bold border border-primary/30"
                        : "text-ink-2 hover:text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAll ? "bg-primary" : "bg-ink-3"
                        }`}
                      />
                      <span className="truncate">Tüm Gruplar</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-surface-muted text-ink-3 border border-line">
                        16 Grup
                      </span>
                      {isAll && <Check size={13} className="text-primary shrink-0" />}
                    </div>
                  </button>

                  {groups.map((grp) => {
                    const isSelected = selectedGroup === grp.grup_no;
                    return (
                      <button
                        key={grp.grup_no}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleGroupSelect(grp.grup_no)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary/15 text-ink font-bold border border-primary/30"
                            : "text-ink-2 hover:text-ink hover:bg-surface-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-primary" : "bg-ink-3"
                            }`}
                          />
                          <span className="truncate">{grp.grup_adi}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-surface-muted text-ink-3 border border-line">
                            {grp.takim_sayisi} Takım
                          </span>
                          {isSelected && (
                            <Check size={13} className="text-primary shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Aktif Grup Bilgisi */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-ink-3">
          <span className="text-[11px] font-medium">
            Aktif:{" "}
            <strong className="text-ink font-bold">
              {isAll ? "Tüm Gruplar" : currentGroup?.grup_adi}
            </strong>
          </span>
          <span>•</span>
          <span className="text-[11px] font-mono tabular-nums">
            {isAll
              ? `16 Grup • ${totalMatches} Maç`
              : `${currentGroup?.takim_sayisi || 0} Takım • ${currentGroup?.mac_sayisi || 0} Maç`}
          </span>
        </div>
      </div>

      {/* 2. HIZLI GRUP BUTONLARI (Pill Bar) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-ink-3 uppercase min-w-[50px] shrink-0">
          Gruplar:
        </span>

        <button
          type="button"
          onClick={() => onSelectGroup("all")}
          title="Kadınlar 2. Ligi Tüm Gruplar"
          className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            isAll
              ? "bg-primary text-primary-fg font-bold"
              : "bg-surface-muted text-ink-2 hover:text-ink hover:bg-surface-raised border border-line"
          }`}
        >
          <span>Tüm Gruplar</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums font-bold ${
              isAll
                ? "bg-black/20 text-primary-fg"
                : "bg-surface text-ink-3 border border-line"
            }`}
          >
            {groups.length}
          </span>
        </button>

        {groups.map((grp) => {
          const isActive = selectedGroup === grp.grup_no;
          return (
            <button
              key={grp.grup_no}
              type="button"
              onClick={() => onSelectGroup(grp.grup_no)}
              title={`Kadınlar 2. Ligi ${grp.grup_adi}`}
              className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-fg font-bold"
                  : "bg-surface-muted text-ink-2 hover:text-ink hover:bg-surface-raised border border-line"
              }`}
            >
              <span>Grup {grp.grup_no}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums font-bold ${
                  isActive
                    ? "bg-black/20 text-primary-fg"
                    : "bg-surface text-ink-3 border border-line"
                }`}
              >
                {grp.takim_sayisi}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
