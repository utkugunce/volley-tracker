"use client";

import React from "react";
import { MapPin, ChevronDown, Search, Check, X } from "lucide-react";
import type { useStandingsCityDropdown } from "@/hooks/useStandingsCityDropdown";

export type StandingsCityDropdown = ReturnType<typeof useStandingsCityDropdown>;

interface CitySelectorProps {
  distinctCities: string[];
  selectedCity: string;
  dropdown: StandingsCityDropdown;
}

/** 1. İL SEÇİMİ (Açılır Menü / Dropdown) ve seçili il göstergesi. */
export function CitySelector({ distinctCities, selectedCity, dropdown }: CitySelectorProps) {
  const {
    isCityDropdownOpen,
    setIsCityDropdownOpen,
    citySearchTerm,
    setCitySearchTerm,
    isCategoryGroupOpen,
    setIsCategoryGroupOpen,
    cityDropdownRef,
    filteredCities,
    handleCitySelect,
  } = dropdown;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10px] sm:text-[11px] font-bold text-ink-2 uppercase flex items-center gap-1.5 shrink-0">
          <MapPin size={13} className="text-ink-2 shrink-0" />
          İL:
        </span>

        {/* Şehir Seçim Dropdown Menüsü */}
        <div className="relative" ref={cityDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            aria-expanded={isCityDropdownOpen}
            aria-haspopup="listbox"
            className="flex items-center justify-between gap-2.5 bg-surface-raised hover:bg-surface-raised/80 text-ink text-xs font-bold px-3.5 py-2 rounded-xl border border-line hover:border-ink-3 transition-all shadow-sm active:scale-95 cursor-pointer min-w-[210px] sm:min-w-[240px] focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-2xs" />
              <span className="text-ink font-extrabold truncate text-[13px]">
                {selectedCity || "İl Seçiniz"}
              </span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0 text-ink-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-canvas border border-line text-ink-2">
                {distinctCities.length} İl
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 text-ink-2 ${
                  isCityDropdownOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </div>
          </button>

          {/* Dropdown Açılır Menü */}
          {isCityDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-canvas border border-line rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Arama Inputu */}
              <div className="p-2.5 border-b border-line bg-surface-muted">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="İl ara (örn: Ankara, İstanbul, İzmir)..."
                    value={citySearchTerm}
                    onChange={(e) => setCitySearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsCityDropdownOpen(false);
                      } else if (e.key === "Enter" && filteredCities.length === 1) {
                        handleCitySelect(filteredCities[0]);
                      }
                    }}
                    className="w-full bg-surface-raised border border-line text-ink text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-ink-3"
                    autoFocus
                  />
                  {citySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCitySearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-0.5 rounded cursor-pointer"
                      title="Temizle"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-3 px-1 pt-1.5">
                  <span>Kayıtlı İller</span>
                  <span className="font-mono text-ink-3">
                    {filteredCities.length} / {distinctCities.length} İl
                  </span>
                </div>
              </div>

              {/* Şehirler Listesi */}
              <div
                className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar"
                role="listbox"
              >
                {filteredCities.length === 0 ? (
                  <div className="p-4 text-center text-xs text-ink-3">
                    Eşleşen il bulunamadı.
                  </div>
                ) : (
                  filteredCities.map((cityName) => {
                    const isSelected = selectedCity === cityName;
                    return (
                      <button
                        key={cityName}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleCitySelect(cityName)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/20 text-primary font-bold border border-primary/40"
                            : "text-ink-2 hover:text-ink hover:bg-surface-raised"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-primary shadow-glow-primary"
                                : "bg-ink-3"
                            }`}
                          />
                          <span className="truncate">{cityName}</span>
                        </span>
                        {isSelected && (
                          <Check
                            size={14}
                            className="text-primary shrink-0"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seçili İl ve Açılır/Kapanır Gösterge */}
      {selectedCity && (
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-ink-2">
          <span className="text-[11px] font-medium text-ink-2">
            Seçili İl: <strong className="text-ink font-bold">{selectedCity}</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsCategoryGroupOpen(!isCategoryGroupOpen)}
            className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer bg-surface-raised px-2.5 py-1 rounded-lg border border-line"
          >
            <span>{isCategoryGroupOpen ? "Filtreleri Gizle" : "Kategori & Grupları Aç"}</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${
                isCategoryGroupOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
