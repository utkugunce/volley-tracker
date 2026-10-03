"use client";

import React from "react";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { CitySelector, type StandingsCityDropdown } from "./CitySelector";
import { CategoryGroupSelector } from "./CategoryGroupSelector";

interface StandingsSelectorBarProps {
  distinctCities: string[];
  selectedCity: string;
  dropdown: StandingsCityDropdown;
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

/** Kategori, Lig ve Grup Seçici Barı (il seçici + yaş grubu / lig / grup sekmeleri). */
export function StandingsSelectorBar({
  distinctCities,
  selectedCity,
  dropdown,
  availableAgeGroups,
  selectedAgeGroup,
  setSelectedAgeGroup,
  availableLeagues,
  selectedLeagueTier,
  setSelectedLeagueTier,
  availableGroups,
  selectedGroupKey,
  setSelectedGroupKey,
}: StandingsSelectorBarProps) {
  const { isCityDropdownOpen, isCategoryGroupOpen } = dropdown;

  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-3 sm:p-4 no-print space-y-3 relative ${
        isCityDropdownOpen ? "z-30" : "z-10"
      }`}
    >
      {/* 1. İL SEÇİMİ (Açılır Menü / Dropdown) */}
      {distinctCities.length > 1 && (
        <CitySelector distinctCities={distinctCities} selectedCity={selectedCity} dropdown={dropdown} />
      )}

      {/* 2. KATEGORİ, LİG VE GRUP SEÇİCİ BÖLÜMÜ (İl seçilince açılır) */}
      <CategoryGroupSelector
        distinctCities={distinctCities}
        selectedCity={selectedCity}
        isCategoryGroupOpen={isCategoryGroupOpen}
        availableAgeGroups={availableAgeGroups}
        selectedAgeGroup={selectedAgeGroup}
        setSelectedAgeGroup={setSelectedAgeGroup}
        availableLeagues={availableLeagues}
        selectedLeagueTier={selectedLeagueTier}
        setSelectedLeagueTier={setSelectedLeagueTier}
        availableGroups={availableGroups}
        selectedGroupKey={selectedGroupKey}
        setSelectedGroupKey={setSelectedGroupKey}
      />
    </div>
  );
}
