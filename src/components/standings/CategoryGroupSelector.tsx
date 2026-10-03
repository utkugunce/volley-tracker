"use client";

import React from "react";
import type { ParsedStandingContext } from "@/utils/standingsParsing";

interface CategoryGroupSelectorProps {
  distinctCities: string[];
  selectedCity: string;
  isCategoryGroupOpen: boolean;
  availableAgeGroups: string[];
  selectedAgeGroup: string;
  setSelectedAgeGroup: (age: string) => void;
  availableLeagues: string[];
  selectedLeagueTier: string;
  setSelectedLeagueTier: (tier: string) => void;
  availableGroups: ParsedStandingContext[];
  selectedGroupKey: string;
  setSelectedGroupKey: (key: string) => void;
}

/** 2. KATEGORİ, LİG VE GRUP SEÇİCİ BÖLÜMÜ (İl seçilince açılır). */
export function CategoryGroupSelector({
  distinctCities,
  selectedCity,
  isCategoryGroupOpen,
  availableAgeGroups,
  selectedAgeGroup,
  setSelectedAgeGroup,
  availableLeagues,
  selectedLeagueTier,
  setSelectedLeagueTier,
  availableGroups,
  selectedGroupKey,
  setSelectedGroupKey,
}: CategoryGroupSelectorProps) {
  if (!distinctCities || distinctCities.length <= 1 || (selectedCity && isCategoryGroupOpen)) {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
        {/* Kategori / Yaş Grubu Seçimi — segmented kontrol */}
        {availableAgeGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase min-w-[55px] sm:min-w-[65px] flex items-center gap-1">
              Kategori:
            </span>
            <div className="inline-flex rounded-xl border border-line bg-canvas p-0.5">
              {availableAgeGroups.map((age) => {
                const isActive = selectedAgeGroup === age;
                return (
                  <button
                    key={age}
                    onClick={() => setSelectedAgeGroup(age)}
                    title={age}
                    aria-pressed={isActive}
                    className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-fg font-bold shadow-glow-primary"
                        : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    <span>{age}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lig Seçimi (Birden çok lig varsa) */}
        {availableLeagues.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-line">
            <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase min-w-[55px] sm:min-w-[65px]">
              Lig:
            </span>
            <div className="inline-flex rounded-xl border border-line bg-canvas p-0.5">
              {availableLeagues.map((lg) => {
                const isActive = selectedLeagueTier === lg;
                return (
                  <button
                    key={lg}
                    onClick={() => setSelectedLeagueTier(lg)}
                    title={lg}
                    className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-surface-raised text-ink font-bold"
                        : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {lg}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grup Seçimi — alt çizgili sekmeler */}
        {availableGroups.length > 0 && (
          <div className="border-b border-line" role="group" aria-label="Grup seçimi">
            <div className="flex flex-wrap items-center gap-0">
              {availableGroups.map((grp) => {
                const isActive = selectedGroupKey === grp.rawKey;
                return (
                  <button
                    key={grp.rawKey}
                    onClick={() => setSelectedGroupKey(grp.rawKey)}
                    title={grp.rawGroup || grp.displayGroup}
                    aria-current={isActive ? "true" : undefined}
                    className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "border-selected text-selected-text font-bold"
                        : "border-transparent text-ink-2 hover:text-ink"
                    }`}
                  >
                    {grp.displayGroup}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 text-center text-xs text-ink-3 bg-canvas rounded-xl border border-dashed border-line">
      Lütfen kategori ve grupları listelemek için yukarıdaki açılır menüden bir il seçiniz.
    </div>
  );
}
