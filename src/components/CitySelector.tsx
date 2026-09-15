"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, ChevronDown, Check, Search, Activity, Globe } from "lucide-react";
import { CityInfo } from "@/types/fixture";

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
    return cities.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ilid.includes(searchTerm) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterTab === "active") {
        return matchSearch && (c.matches_count > 0 || c.standings_count > 0);
      }
      return matchSearch;
    });
  }, [cities, searchTerm, filterTab]);

  const activeCitiesCount = useMemo(() => {
    return cities.filter((c) => c.matches_count > 0 || c.standings_count > 0).length;
  }, [cities]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Şehir Seçim Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
        title="İl Seçiniz (81 TVF İl Temsilciliği)"
      >
        <MapPin size={13} className="text-primary flex-shrink-0" />
        <span className="font-bold">
          {currentCity.name}
          <span className="text-slate-400 font-normal ml-1">({currentCity.ilid})</span>
        </span>
        {currentCity.matches_count > 0 && (
          <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {currentCity.matches_count}
          </span>
        )}
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Açılır Menü */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Arama Inputu */}
          <div className="p-2.5 border-b border-slate-800 bg-[#0b1325]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İl veya plaka ara (örn: 35, İzmir)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 text-white placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>

            {/* Tab Filtreleri */}
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded transition-colors ${
                  filterTab === "all"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tüm İller ({cities.length})
              </button>
              <button
                onClick={() => setFilterTab("active")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors ${
                  filterTab === "active"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity size={12} />
                <span>Aktif Fikstür ({activeCitiesCount})</span>
              </button>
            </div>
          </div>

          {/* İller Listesi */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
            {filteredCities.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aramanıza uygun il bulunamadı.
              </div>
            ) : (
              filteredCities.map((c) => {
                const isSelected = c.slug === currentCitySlug;
                const hasMatches = c.matches_count > 0;

                return (
                  <button
                    key={c.slug || c.ilid}
                    onClick={() => {
                      onSelectCity(c.slug);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors hover:bg-slate-800/70 ${
                      isSelected ? "bg-primary/20 text-white font-bold" : "text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400 w-6 text-right font-normal">
                        {c.ilid ? String(c.ilid).padStart(2, "0") : "--"}
                      </span>
                      <span>{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasMatches ? (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          {c.matches_count} Maç
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Takvim Bekleniyor
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-primary ml-1" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Alt Bilgi */}
          <div className="p-2 border-t border-slate-800 bg-[#0b1325] text-[10px] text-slate-400 flex items-center justify-between">
            <span>Türkiye Voleybol Federasyonu</span>
            <span className="text-amber-400 font-mono">81 İl Temsilciliği</span>
          </div>
        </div>
      )}
    </div>
  );
};
