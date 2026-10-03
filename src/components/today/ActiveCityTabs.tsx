"use client";

import React from "react";
import type { CityInfo } from "@/types/fixture";
import type { ActiveCityCard } from "@/utils/todayMatches";

interface ActiveCityTabsProps {
  citiesList: CityInfo[] | undefined;
  activeCityCards: ActiveCityCard[];
  currentCitySlug: string;
  onSelectCity: (slug: string) => void;
}

/** 2. AKTİF İL HIZLI KARTLARI */
export function ActiveCityTabs({ citiesList, activeCityCards, currentCitySlug, onSelectCity }: ActiveCityTabsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1" role="tablist" aria-label="Aktif şehir hızlı erişim sekmeleri">
      {citiesList === undefined ? (
        <div className="flex items-center gap-2 py-1">
          <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
          <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
          <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
        </div>
      ) : (
        activeCityCards.map((item) => {
          const isSelected = currentCitySlug === item.slug;
          const IconComponent = item.icon;

          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`${item.name}, ${item.count} maç`}
              onClick={() => onSelectCity(item.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "bg-primary text-primary-fg shadow-glow-primary font-bold border-primary"
                  : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border-slate-800/80"
              }`}
            >
              <IconComponent
                size={14}
                aria-hidden="true"
                className={isSelected ? "text-primary-fg" : "text-slate-400"}
              />
              <span>{item.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected
                    ? "bg-black/20 text-primary-fg"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
