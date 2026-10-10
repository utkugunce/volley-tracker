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

  // Dışarı tıklayınca dropdown'ı kapat
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

  // ESC tuşu ile kapatma
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
      className={`glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-800/80 shadow-card no-print space-y-3 relative ${
        isGroupDropdownOpen ? "z-30" : "z-10"
      }`}
    >
      {/* 1. ÜST BAR: GRUP SEÇİMİ DROPDOWN MENÜSÜ & ÖZET BİLGİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 shrink-0">
            <Layers size={13} className="text-primary shrink-0" />
            GRUP:
          </span>

          {/* Grup Seçim Dropdown Menüsü */}
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
              className="flex items-center justify-between gap-2.5 bg-slate-900/90 hover:bg-slate-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm active:scale-95 cursor-pointer min-w-[210px] sm:min-w-[240px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-2xs" />
                <span className="text-white font-extrabold truncate text-[13px]">
                  {isAll
                    ? "Tüm Gruplar (16 Grup)"
                    : currentGroup?.grup_adi || `${selectedGroup}. Grup`}
                </span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {isAll ? `${totalTeams} Takım` : `${currentGroup?.takim_sayisi || 0} Takım`}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-slate-400 ${
                    isGroupDropdownOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Açılır Menü */}
            {isGroupDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-canvas border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-slate-800 bg-surface-muted flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-primary" />
                    <span>Kadınlar 2. Ligi Grupları</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    16 Grup · {totalTeams} Takım
                  </span>
                </div>

                {/* Gruplar Listesi */}
                <div
                  className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
                  role="listbox"
                >
                  {/* Tüm Gruplar Opsiyonu */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isAll}
                    onClick={() => handleGroupSelect("all")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isAll
                        ? "bg-primary/20 text-white font-bold border border-primary/40"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAll ? "bg-primary shadow-glow-primary" : "bg-slate-600"
                        }`}
                      />
                      <span className="truncate">Tüm Gruplar</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50">
                        16 Grup
                      </span>
                      {isAll && <Check size={14} className="text-primary shrink-0" />}
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/20 text-white font-bold border border-primary/40"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-primary shadow-glow-primary"
                                : "bg-slate-600"
                            }`}
                          />
                          <span className="truncate">{grp.grup_adi}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50">
                            {grp.takim_sayisi} Takım
                          </span>
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-primary shrink-0"
                            />
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
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
          <span className="text-[11px] font-medium text-slate-400">
            Aktif:{" "}
            <strong className="text-white font-bold">
              {isAll ? "Tüm Gruplar" : currentGroup?.grup_adi}
            </strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-mono text-slate-400">
            {isAll
              ? `16 Grup • ${totalMatches} Maç`
              : `${currentGroup?.takim_sayisi || 0} Takım • ${currentGroup?.mac_sayisi || 0} Maç`}
          </span>
        </div>
      </div>

      {/* 2. HIZLI GRUP BUTONLARI (Pill Bar) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase min-w-[50px] shrink-0">
          Gruplar:
        </span>

        {/* Tüm Gruplar Hızlı Butonu */}
        <button
          type="button"
          onClick={() => onSelectGroup("all")}
          title="Kadınlar 2. Ligi Tüm Gruplar"
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            isAll
              ? "bg-primary text-primary-fg shadow-glow-primary"
              : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60"
          }`}
        >
          <span>Tüm Gruplar</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              isAll
                ? "bg-white/20 text-primary-fg"
                : "bg-slate-800 text-slate-400 border border-slate-700/60"
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
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-fg shadow-glow-primary"
                  : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60"
              }`}
            >
              <span>Grup {grp.grup_no}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-white/20 text-primary-fg"
                    : "bg-slate-800 text-slate-400 border border-slate-700/60"
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
