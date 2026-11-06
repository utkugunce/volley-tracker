"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { MapPin, ChevronDown, Check, Search, Activity } from "lucide-react";
import { CityInfo } from "@/types/fixture";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { useDialogFocus } from "@/hooks/useDialogFocus";

interface CitySelectorProps {
  currentCitySlug: string;
  onSelectCity: (slug: string) => void;
  cities: CityInfo[];
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  currentCitySlug,
  onSelectCity,
  cities,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"active" | "all">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useDialogFocus(isOpen, panelRef);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const currentCity = useMemo(() => {
    if (currentCitySlug === "all") {
      return {
        ilid: "TR",
        name: "Tüm İller",
        slug: "all",
        matches_count: 0,
        status: "Aktif",
      };
    }
    return (
      cities.find((c) => c.slug === currentCitySlug) || {
        ilid: "--",
        name: currentCitySlug ? currentCitySlug.toUpperCase() : "İl Seçin",
        slug: currentCitySlug,
        matches_count: 0,
        status: "",
      }
    );
  }, [cities, currentCitySlug]);

  const filteredCities = useMemo(() => {
    const term = trLower(searchTerm).trim();
    return cities.filter((c) => {
      const matchSearch =
        trIncludes(c.name, term) ||
        (c.ilid?.includes(term) ?? false) ||
        trIncludes(c.slug, term);

      if (filterTab === "active") {
        return matchSearch && (c.matches_count > 0 || (c.standings_count ?? 0) > 0);
      }
      return matchSearch;
    });
  }, [cities, searchTerm, filterTab]);

  const activeCitiesCount = useMemo(() => {
    return cities.filter((c) => c.matches_count > 0 || (c.standings_count ?? 0) > 0).length;
  }, [cities]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Şehir Seçim Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${currentCity.name} seçili. İl seçiciyi ${isOpen ? "kapat" : "aç"}`}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-surface-raised active:scale-[0.98] sm:w-auto"
        title="İl Seçiniz (81 TVF İl Temsilciliği)"
      >
        <MapPin size={14} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="font-semibold">
          {currentCity.name}
          <span className="ml-1 font-normal text-ink-3">({currentCity.ilid})</span>
        </span>
        {currentCity.matches_count > 0 && (
          <span className="font-display text-xs font-semibold tabular-nums text-ink-2">
            {currentCity.matches_count}
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-ink-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Açılır Menü */}
      {isOpen && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="İl seçimi"
          tabIndex={-1}
          className="fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:mt-2 lg:w-80 lg:max-h-none lg:slide-in-from-bottom-0 lg:zoom-in-95"
        >
          {/* Arama Inputu */}
          <div className="border-b border-line bg-surface-muted p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-ink-3" aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="İl veya plaka ara"
                placeholder="İl veya plaka ara (örn: 35, İzmir)..."
                className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>

            {/* Tab Filtreleri */}
            <div className="flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                aria-pressed={filterTab === "all"}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-300 ${
                  filterTab === "all"
                    ? "bg-primary text-primary-fg"
                    : "text-ink-2 hover:bg-surface-raised hover:text-ink"
                }`}
              >
                Tüm İller ({cities.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("active")}
                aria-pressed={filterTab === "active"}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-300 ${
                  filterTab === "active"
                    ? "bg-primary text-primary-fg"
                    : "text-ink-2 hover:bg-surface-raised hover:text-ink"
                }`}
              >
                <Activity size={12} aria-hidden="true" />
                <span>Aktif Fikstür ({activeCitiesCount})</span>
              </button>
            </div>
          </div>

          {/* İller Listesi */}
          <div className="max-h-[min(50dvh,24rem)] overflow-y-auto divide-y divide-line/60 custom-scrollbar">
            {filteredCities.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink-3">
                Aramanıza uygun il bulunamadı.
              </div>
            ) : (
              filteredCities.map((c) => {
                const isSelected = c.slug === currentCitySlug;
                const hasMatches = c.matches_count > 0;

                return (
                  <button
                    key={c.slug || c.ilid}
                    type="button"
                    onClick={() => {
                      onSelectCity(c.slug);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    aria-current={isSelected ? "true" : undefined}
                    className={`flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-300 hover:bg-surface-raised ${
                      isSelected ? "bg-primary text-primary-fg font-bold" : "text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 text-right font-mono text-xs font-normal ${isSelected ? "text-primary-fg/80" : "text-ink-3"}`}>
                        {c.ilid ? String(c.ilid).padStart(2, "0") : "--"}
                      </span>
                      <span>{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasMatches ? (
                        <span className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${isSelected ? "border-primary-fg/30 text-primary-fg" : "border-done/30 bg-done/10 text-done"}`}>
                          {c.matches_count} Maç
                        </span>
                      ) : (
                        <span className={`text-xs ${isSelected ? "text-primary-fg/80" : "text-ink-3"}`}>
                          Takvim Bekleniyor
                        </span>
                      )}
                      {isSelected && <Check size={14} className="ml-1 text-primary-fg" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Alt Bilgi */}
          <div className="flex items-center justify-between border-t border-line bg-surface-muted p-2 text-xs text-ink-3">
            <span>Türkiye Voleybol Federasyonu</span>
            <span className="font-mono text-primary">81 İl Temsilciliği</span>
          </div>
        </div>
      )}
    </div>
  );
};
