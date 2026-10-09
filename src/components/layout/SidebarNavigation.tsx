"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Star, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Shield
} from "lucide-react";
import { CityInfo, Match } from "@/types/fixture";
import { 
  buildLeagueHierarchy, 
  CityLeagueHierarchy, 
  AgeCategoryNode, 
  LeagueGroupNode 
} from "@/utils/leagueHierarchy";

interface SidebarNavigationProps {
  cities?: CityInfo[];
  currentCity?: string;
  onSelectCity?: (citySlug: string) => void;
  matches?: Match[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  favoritesCount?: number;
  totalMatches?: number;
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
}) => {
  // Akordiyon durumları
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({
    [currentCity]: true,
    all: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Şehir plakası eşleştirmesi (ilid)
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

  // Hiyerarşik ağacı oluştur
  const hierarchyList = useMemo(() => {
    return buildLeagueHierarchy(matches, plateLookup);
  }, [matches, plateLookup]);

  // Şehir değiştiğinde ilgili şehri otomatik aç
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
    <div className="flex flex-col h-full text-xs select-none bg-panel">
      {/* 1. Üst Başlık & Sofascore Lig Sayacı */}
      <div className="px-3.5 py-3 border-b border-line flex items-center justify-between bg-panel/90 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Trophy size={13} />
          </div>
          <div>
            <h2 className="font-bold text-white text-[13px] tracking-wide leading-tight">Lig Ağacı</h2>
            <p className="text-[10px] text-ink-2">TVF Altyapı Hiyerarşisi</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-canvas text-blue-400 px-2 py-0.5 rounded border border-line">
          {totalMatches > 0 ? `${totalMatches} Maç` : "81 İl"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
        {/* 1. BÖLÜM: FAVORİLERİM & HIZLI ERİŞİM */}
        <div className="bg-surface-muted rounded-xl border border-line p-2 space-y-1">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-ink-2 hover:text-white px-1.5 py-1 rounded transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Star size={12} className="text-amber-400 fill-amber-400/20" />
              <span>Favorilerim</span>
            </span>
            <ChevronDown 
              size={12} 
              className={`transform transition-transform duration-200 ${isFavoritesOpen ? "rotate-0" : "-rotate-90"}`} 
            />
          </button>

          {isFavoritesOpen && (
            <div className="space-y-1 pt-1">
              {/* Takip Edilen Maçlar Butonu */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-panel/60 hover:bg-panel border border-transparent hover:border-line text-ink transition-all">
                <span className="flex items-center gap-2">
                  <Star size={12} className="text-amber-400" />
                  <span className="font-medium text-[11px]">Yıldızlı Maçlar</span>
                </span>
                <span className="font-display font-semibold tabular-nums text-ink-2 text-[10px]">
                  {favoritesCount}
                </span>
              </div>

              {/* TVF Kadınlar 2. Ligi Hızlı Geçiş */}
              <Link
                href="/kadinlar-2-ligi"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/40 text-purple-200 transition-all group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0" />
                  <span className="font-semibold text-[11px] truncate group-hover:text-white">TVF Kadınlar 2. Ligi</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono shrink-0">16 Grup →</span>
              </Link>

              {/* Kulüpler Dizini Hızlı Geçiş */}
              <Link
                href="/kulupler"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-panel/60 hover:bg-panel border border-transparent hover:border-line text-ink transition-all group"
              >
                <span className="flex items-center gap-2 truncate">
                  <Shield size={12} className="text-blue-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate group-hover:text-white">Kulüpler Rehberi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">İl / İlçe →</span>
              </Link>

              {/* Hangi Ligde Oynar? Rehber Aracı */}
              <Link
                href="/hangi-ligde-oynar"
                prefetch={false}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-950/60 border border-amber-800/40 text-amber-200 transition-all group"
              >
                <span className="flex items-center gap-2 truncate">
                  <Sparkles size={12} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-[11px] truncate group-hover:text-white">Hangi Ligde Oynar?</span>
                </span>
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0">YENİ</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: İLLER & ALTYAPI LİGLERİ HİYERARŞİSİ */}
        <div className="bg-surface-muted rounded-xl border border-line p-2 space-y-1">
          <div className="flex items-center justify-between px-1.5 py-1 text-[10px] uppercase font-bold tracking-wider text-ink-2">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-blue-400" />
              <span>İller & Altyapı Ligleri</span>
            </span>
          </div>

          {/* En Üstte: "Tümünü Göster" Filtre Seçeneği */}
          <button
            type="button"
            onClick={() => {
              if (onSelectCity) onSelectCity("all");
              if (onSelectCategory) onSelectCategory("Tümü");
            }}
            className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              selectedCategory === "Tümü" && (currentCity === "all" || !currentCity)
                ? "border-l-2 border-selected bg-selected/10 text-white font-bold"
                : "text-ink-2 hover:text-ink hover:bg-panel"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={13} className="text-blue-400" />
              <span>Tümünü Göster</span>
            </span>
            <span className="text-[10px] font-mono text-ink-2">Hepsi</span>
          </button>

          {/* İller Listesi (Plaka / Alfabetik Sıralı) */}
          <div className="space-y-1 pt-1">
            {hierarchyList.map((cityNode) => {
              const isCityActive = currentCity === cityNode.citySlug;
              const isExpanded = Boolean(expandedCities[cityNode.citySlug]);

              return (
                <div key={cityNode.citySlug} className="rounded-lg overflow-hidden border border-transparent">
                  {/* İl Başlığı / Akordiyon Butonu */}
                  <div
                    className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                      isCityActive
                        ? "border-l-2 border-selected bg-selected/10 text-white font-bold"
                        : "text-ink-2 hover:text-white hover:bg-panel"
                    }`}
                    onClick={() => {
                      if (onSelectCity) onSelectCity(cityNode.citySlug);
                      toggleCityExpand(cityNode.citySlug);
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronDown
                        size={12}
                        className={`text-ink-2 shrink-0 transform transition-transform duration-200 ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      {cityNode.plate && (
                        <span className="font-mono text-[10px] text-blue-400 font-bold bg-canvas px-1 py-0.2 rounded border border-line">
                          {cityNode.plate}
                        </span>
                      )}
                      <span className="truncate text-xs">{cityNode.cityName}</span>
                    </div>

                    <span className="font-mono text-[10px] text-ink-2 shrink-0 ml-1">
                      {cityNode.totalMatches}
                    </span>
                  </div>

                  {/* İl Altındaki Yaş Kategorileri (Açılır Ağaç) */}
                  {isExpanded && (
                    <div className="pl-5 pr-1 py-1 space-y-1 border-l border-line/50 ml-3.5 my-0.5 animate-in fade-in-50 duration-150">
                      {cityNode.categories.map((cat) => {
                        const catId = `${cityNode.citySlug}-${cat.key}`;
                        const isCatExpanded = Boolean(expandedCategories[catId]);
                        const isCatSelected = selectedCategory === cat.label || selectedCategory === cat.shortLabel;

                        return (
                          <div key={cat.key} className="space-y-0.5">
                            {/* Kategori Satırı (Örn: Genç Kızlar U18) */}
                            <div
                              onClick={() => {
                                if (onSelectCity) onSelectCity(cityNode.citySlug);
                                handleCategoryClick(cat.label);
                                toggleCategoryExpand(catId);
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-md transition-all text-[11px] cursor-pointer ${
                                isCatSelected
                                  ? "border-l-2 border-blue-500 bg-blue-500/15 text-blue-300 font-bold"
                                  : "text-ink-2 hover:text-white hover:bg-panel/80"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {cat.groups.length > 0 && (
                                  <ChevronDown
                                    size={11}
                                    className={`text-ink-2 shrink-0 transform transition-transform duration-200 ${
                                      isCatExpanded ? "rotate-0" : "-rotate-90"
                                    }`}
                                  />
                                )}
                                <span className="truncate">{cat.label}</span>
                              </div>
                              <span className="text-[10px] font-mono text-ink-2">
                                {cat.matchesCount}
                              </span>
                            </div>

                            {/* Kategori Altındaki Gruplar (Örn: A Grubu, B Grubu, Klasman 1) */}
                            {isCatExpanded && cat.groups.length > 0 && (
                              <div className="pl-4 py-0.5 space-y-0.5 border-l border-line/40 ml-2 animate-in fade-in-50 duration-100">
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
                                      className={`w-full flex items-center justify-between py-1 px-2 rounded text-[10px] font-medium text-left transition-all cursor-pointer ${
                                        isGroupSelected
                                          ? "border-l-2 border-blue-500 bg-blue-500/20 text-blue-200 font-bold"
                                          : "text-ink-2 hover:text-ink hover:bg-panel"
                                      }`}
                                    >
                                      <span className="truncate">• {group.name}</span>
                                      <span className="font-mono text-[9px] text-ink-2">
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
