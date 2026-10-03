"use client";

import React from "react";
import { Layers, X } from "lucide-react";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import type { Match } from "@/types/fixture";
import type { CityListItem } from "@/hooks/useCitiesList";

interface MobileLeaguesMenuProps {
  cities: CityListItem[];
  currentCitySlug: string;
  matches: Match[];
  selectedCategory: string;
  favoritesCount: number;
  totalMatches: number;
  onSelectCity: (slug: string) => void;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

/** Mobil Tam Ekran Ligler Menüsü (Sol Panel Ağacı) */
export const MobileLeaguesMenu: React.FC<MobileLeaguesMenuProps> = ({
  cities,
  currentCitySlug,
  matches,
  selectedCategory,
  favoritesCount,
  totalMatches,
  onSelectCity,
  onSelectCategory,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex flex-col animate-in fade-in duration-200">
    <div className="flex items-center justify-between px-4 py-3 bg-panel border-b border-line">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-blue-400" />
        <h2 className="text-sm font-bold text-white">Lig Navigasyonu</h2>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-ink-2 hover:text-white hover:bg-surface-muted transition-colors"
        aria-label="Kapat"
      >
        <X size={18} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-3 bg-canvas">
      <SidebarNavigation
        cities={cities}
        currentCity={currentCitySlug}
        onSelectCity={(city) => {
          onSelectCity(city);
          onClose();
        }}
        matches={matches}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          onSelectCategory(cat);
          onClose();
        }}
        favoritesCount={favoritesCount}
        totalMatches={totalMatches}
      />
    </div>
  </div>
);
