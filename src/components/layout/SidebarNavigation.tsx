"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Star,
  MapPin,
  ChevronDown,
  Layers,
  PanelLeftClose,
} from "lucide-react";
import { CityInfo, Match } from "@/types/fixture";
import { buildLeagueHierarchy } from "@/utils/leagueHierarchy";

interface SidebarNavigationProps {
  cities?: CityInfo[];
  currentCity?: string;
  onSelectCity?: (citySlug: string) => void;
  matches?: Match[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  favoritesCount?: number;
  totalMatches?: number;
  onToggleCollapse?: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  cities = [],
  currentCity = "all",
  onSelectCity,
  matches = [],
  selectedCategory = "Tümü",
  onSelectCategory,
  favoritesCount = 0,
  totalMatches = 0,
  onToggleCollapse,
}) => {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({
    [currentCity]: true,
    all: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const plateLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of cities) {
      if (c.ilid) {
        map[c.name] = c.ilid.padStart(2, "0");
        map[c.slug] = c.ilid.padStart(2, "0");
      }
    }
    return map;
  }, [cities]);

  const hierarchyList = useMemo(() => {
    return buildLeagueHierarchy(matches, plateLookup);
  }, [matches, plateLookup]);

  useEffect(() => {
    if (currentCity && currentCity !== "all") {
      setExpandedCities((prev) => ({ ...prev, [currentCity]: true }));
    }
  }, [currentCity]);

  const toggleCityExpand = (citySlug: string) => {
    setExpandedCities((prev) => ({
      ...prev,
      [citySlug]: !prev[citySlug],
    }));
  };

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleCategoryClick = (categoryFilter: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryFilter);
    }
  };

  return (
    <div className="flex flex-col h-full text-xs bg-surface">
      {/* 1. Üst Başlık */}
      <div className="px-3.5 py-3 border-b border-line/60 flex items-center justify-between bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy size={14} className="text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="font-bold text-white text-[13px] tracking-tight leading-tight truncate">Lig Ağacı</h2>
            <p className="text-[10px] text-ink-3 truncate">TVF Altyapı Hiyerarşisi</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono tabular-nums font-medium text-ink-3">
            {totalMatches > 0 ? `${totalMatches} Maç` : "81 İl"}
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-raised/80 hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-all cursor-pointer text-[11px] font-semibold active:scale-95"
              title="Lig Ağacını Daralt"
              aria-label="Lig Ağacını Daralt"
            >
              <PanelLeftClose size={13} className="text-primary" />
              <span>Daralt</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
        {/* 1. BÖLÜM: FAVORİLERİM & HIZLI ERİŞİM */}
        <div className="space-y-1 pb-2 border-b border-line/50">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-ink-3 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Star size={12} className="text-warn" />
              <span>Favorilerim</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isFavoritesOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isFavoritesOpen && (
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-ink-2">
                <span className="flex items-center gap-2">
                  <Star size={12} className="text-warn" />
                  <span className="font-medium text-[11px]">Yıldızlı Maçlar</span>
                </span>
                <span className="font-display font-semibold tabular-nums text-ink-3 text-[11px]">
                  {favoritesCount}
                </span>
              </div>

              <Link
                href="/sultanlar-ligi"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">Vodafone Sultanlar Ligi</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono shrink-0">Süper Lig →</span>
              </Link>

              <Link
                href="/kadinlar-1-ligi"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">KFC Kadınlar 1. Ligi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">A & B Grubu →</span>
              </Link>

              <Link
                href="/kadinlar-2-ligi"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">TVF Kadınlar 2. Ligi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">16 Grup →</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: İLLER & ALTYAPI LİGLERİ HİYERARŞİSİ */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-ink-3">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              <span>İller & Altyapı Ligleri</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSelectCity) onSelectCity("all");
              if (onSelectCategory) onSelectCategory("Tümü");
            }}
            className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
              selectedCategory === "Tümü" && (currentCity === "all" || !currentCity)
                ? "bg-primary/15 text-primary font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={13} className="text-current opacity-80" />
              <span>Tümünü Göster</span>
            </span>
            <span className="text-[10px] font-mono text-ink-3">Hepsi</span>
          </button>

          <div className="space-y-0.5 pt-1">
            {hierarchyList.map((cityNode) => {
              const isCityActive = currentCity === cityNode.citySlug;
              const isExpanded = Boolean(expandedCities[cityNode.citySlug]);

              return (
                <div key={cityNode.citySlug} className="rounded-lg overflow-hidden">
                  <div
                    className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      isCityActive
                        ? "bg-primary/15 text-white font-semibold"
                        : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
                    }`}
                    onClick={() => {
                      if (onSelectCity) onSelectCity(cityNode.citySlug);
                      toggleCityExpand(cityNode.citySlug);
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronDown
                        size={12}
                        className={`text-ink-3 shrink-0 transform transition-transform duration-200 ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      {cityNode.plate && (
                        <span className="font-mono text-[10px] text-ink-3 tabular-nums">
                          {cityNode.plate}
                        </span>
                      )}
                      <span className="truncate text-xs">{cityNode.cityName}</span>
                    </div>

                    <span className="font-mono tabular-nums text-[10px] text-ink-3 shrink-0 ml-1">
                      {cityNode.totalMatches}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-line/50 ml-3.5 my-0.5">
                      {cityNode.categories.map((cat) => {
                        const catId = `${cityNode.citySlug}-${cat.key}`;
                        const isCatExpanded = Boolean(expandedCategories[catId]);
                        const isCatSelected = selectedCategory === cat.label || selectedCategory === cat.shortLabel;

                        return (
                          <div key={cat.key} className="space-y-0.5">
                            <div
                              onClick={() => {
                                if (onSelectCity) onSelectCity(cityNode.citySlug);
                                handleCategoryClick(cat.label);
                                toggleCategoryExpand(catId);
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-md transition-colors text-[11px] cursor-pointer ${
                                isCatSelected
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "text-ink-2 hover:text-white hover:bg-surface-raised/40"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {cat.groups.length > 0 && (
                                  <ChevronDown
                                    size={11}
                                    className={`text-ink-3 shrink-0 transform transition-transform duration-200 ${
                                      isCatExpanded ? "rotate-0" : "-rotate-90"
                                    }`}
                                  />
                                )}
                                <span className="truncate">{cat.label}</span>
                              </div>
                              <span className="text-[10px] font-mono tabular-nums text-ink-3">
                                {cat.matchesCount}
                              </span>
                            </div>

                            {isCatExpanded && cat.groups.length > 0 && (
                              <div className="pl-3.5 py-0.5 space-y-0.5 border-l border-line/40 ml-2">
                                {cat.groups.map((group) => {
                                  const isGroupSelected = selectedCategory === group.filterValue || selectedCategory === group.name;

                                  return (
                                    <button
                                      key={group.name}
                                      type="button"
                                      onClick={() => {
                                        if (onSelectCity) onSelectCity(cityNode.citySlug);
                                        handleCategoryClick(group.filterValue);
                                      }}
                                      className={`w-full flex items-center justify-between py-1 px-2 rounded text-[10px] font-medium text-left transition-colors cursor-pointer ${
                                        isGroupSelected
                                          ? "bg-primary/15 text-primary font-semibold"
                                          : "text-ink-3 hover:text-white hover:bg-surface-raised/40"
                                      }`}
                                    >
                                      <span className="truncate">• {group.name}</span>
                                      <span className="font-mono tabular-nums text-[9px] text-ink-3">
                                        {group.matchesCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
