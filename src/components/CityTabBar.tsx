"use client";

import React, { useRef, useState, useEffect } from "react";
import { MapPin, Globe, ChevronDown, Check, Search } from "lucide-react";
import { CityInfo } from "@/types/fixture";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { isCityHidden } from "@/utils/hiddenCities";

interface CityTabBarProps {
  currentCitySlug: string;
  onSelectCity: (slug: string) => void;
  cities: CityInfo[];
  totalMatchesAcrossAll?: number;
}

// Varsayılan olarak hızlı sekme olarak gösterilecek öncelikli iller
const PRIMARY_CITIES = [
  { slug: "all", name: "Tüm İller", isAll: true },
  { slug: "istanbul", name: "İstanbul", ilid: "34" },
  { slug: "izmir", name: "İzmir", ilid: "35" },
  { slug: "yalova", name: "Yalova", ilid: "77" },
  { slug: "nigde", name: "Niğde", ilid: "51" },
  { slug: "bursa", name: "Bursa", ilid: "16" },
  { slug: "antalya", name: "Antalya", ilid: "07" },
  { slug: "duzce", name: "Düzce", ilid: "81" },
].filter((item) => !isCityHidden(item.slug));

export const CityTabBar: React.FC<CityTabBarProps> = ({
  currentCitySlug,
  onSelectCity,
  cities = [],
  totalMatchesAcrossAll,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca açılır menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aktif seçili il
  const currentCity = cities.find((c) => c.slug === currentCitySlug);

  // Sekmelerde görünmesi gereken iller listesi (birincil iller + eğer farklı bir il seçilmişse o il)
  const tabCities = React.useMemo(() => {
    const list = [...PRIMARY_CITIES];
    // Eğer seçilen il birincil listede yoksa, geçici olarak sekmelere ekle
    if (
      currentCitySlug &&
      currentCitySlug !== "all" &&
      !list.some((item) => item.slug === currentCitySlug)
    ) {
      if (currentCity) {
        list.push({
          slug: currentCity.slug,
          name: currentCity.name,
          ilid: currentCity.ilid,
        });
      }
    }
    return list;
  }, [currentCitySlug, currentCity]);

  // Her ilin maç sayısını bul
  const getCityMatchCount = (slug: string, isAll?: boolean) => {
    if (isAll) {
      if (typeof totalMatchesAcrossAll === "number") return totalMatchesAcrossAll;
      // İllerin toplamını hesapla
      return cities.reduce((acc, c) => acc + (c.matches_count || 0), 0);
    }
    const found = cities.find((c) => c.slug === slug);
    return found?.matches_count || 0;
  };

  // Açılır menüdeki filtrelenmiş 81 il
  const filteredDropdownCities = cities
    .filter((c) => !isCityHidden(c.slug))
    .filter((c) => {
      const term = trLower(searchTerm).trim();
      return (
        trIncludes(c.name, term) ||
        c.ilid.includes(term) ||
        trIncludes(c.slug, term)
      );
    });

  return (
    <div className="bg-[#070d19]/90 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-4 py-1.5 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Yatay Kaydırılabilir Sekmeler */}
        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Şehir sekmeleri"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabCities.map((item) => {
            const isSelected = currentCitySlug === item.slug;
            const matchCount = getCityMatchCount(item.slug, item.isAll);

            return (
              <button
                key={item.slug}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCity(item.slug)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  isSelected
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-glow-red font-bold ring-1 ring-red-500/40"
                    : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border-slate-800/80"
                }`}
                title={`${item.name} maçlarını ve fikstürünü görüntüle`}
                aria-label={`${item.name} maçlarını ve fikstürünü görüntüle`}
              >
                {item.isAll ? (
                  <Globe
                    size={13}
                    aria-hidden="true"
                    className={isSelected ? "text-white" : "text-slate-400"}
                  />
                ) : (
                  <MapPin
                    size={13}
                    aria-hidden="true"
                    className={isSelected ? "text-white" : "text-slate-400"}
                  />
                )}
                <span>{item.name}</span>
                {item.ilid && !isSelected && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    {item.ilid}
                  </span>
                )}
                {matchCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                    }`}
                  >
                    {matchCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 81 İl Seçici Açılır Buton (+ Diğer İller) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-controls="city-dropdown-menu"
            aria-label="Tüm 81 ili listele ve seç"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              dropdownOpen
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800"
            }`}
            title="Tüm 81 ili ara ve seç"
          >
            <span className="text-slate-400 font-bold" aria-hidden="true">+</span>
            <span className="hidden sm:inline">Diğer İller</span>
            <span className="sm:hidden">81 İl</span>
            <ChevronDown
              size={12}
              aria-hidden="true"
              className={`text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Açılır Menü */}
          {dropdownOpen && (
            <div
              id="city-dropdown-menu"
              role="listbox"
              aria-label="81 İl Seçici"
              className="absolute right-0 mt-1.5 w-64 sm:w-72 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="p-2 border-b border-slate-800 bg-[#0b1325]">
                <div className="relative">
                  <Search size={13} aria-hidden="true" className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="İl ara (örn: Ankara, 06)..."
                    aria-label="İl ara"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
                {filteredDropdownCities.map((c) => {
                  const isCur = currentCitySlug === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      role="option"
                      aria-selected={isCur}
                      onClick={() => {
                        onSelectCity(c.slug);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-800 ${
                        isCur
                          ? "bg-primary/20 text-white font-bold"
                          : "hover:bg-slate-800/70 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono w-5 text-right text-[11px]">
                          {c.ilid}
                        </span>
                        <span>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.matches_count > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] px-1.5 rounded-full font-mono">
                            {c.matches_count}
                          </span>
                        )}
                        {isCur && <Check size={12} aria-hidden="true" className="text-primary" />}
                      </div>
                    </button>
                  );
                })}
                {filteredDropdownCities.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    İl bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
